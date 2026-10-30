import "server-only";
import { ObjectId } from "mongodb";
import { cols, HttpError } from "./db";
import { compile } from "./compile";
import { JobCard } from "./jobcard";
import type { Clinic, Run, RunResult, TestDef, Version, Call } from "./types";
import * as EL from "./elevenlabs";
import { defaultTests, coachTest, type TestSpec } from "./testpack";
import { coachToRule, refineCard, summarizeCall } from "./gemini";

export async function getClinic(id: ObjectId) {
  const { clinics } = await cols();
  const c = await clinics.findOne({ _id: id });
  if (!c) throw new HttpError(404, "Clinic not found");
  return c;
}

async function saveTests(clinicId: ObjectId, specs: TestSpec[]) {
  const { tests } = await cols();
  const created: TestDef[] = [];
  for (const s of specs) {
    const elTestId = await EL.createElTest(s.body);
    const { body: _body, ...rest } = s; void _body;
    const doc: TestDef = { ...rest, _id: new ObjectId(), clinicId, elTestId, createdAt: new Date() };
    await tests.insertOne(doc);
    created.push(doc);
  }
  return created;
}

const toolList = (c: Clinic) => (c.toolIds ? [c.toolIds.checkSlots, c.toolIds.bookSlot, c.toolIds.logCallback] : []);

// Job card approved → version 1 of the receptionist and the eight tests it must pass.
export async function approve(clinicId: ObjectId, cardInput: unknown) {
  const card = JobCard.parse(cardInput);
  const { clinics, versions } = await cols();
  const c = await getClinic(clinicId);
  if (c.agentId) throw new HttpError(409, "This receptionist was already created. Use Coach or Refine to change it.");
  if (!card.voiceId) {
    const v = await EL.sharedIndianVoices().catch(() => []);
    if (v[0]) Object.assign(card, { voiceId: v[0].id, voiceName: v[0].name, voiceOwner: v[0].owner });
  }
  Object.assign(card, await EL.ensureVoice(card));
  const { tests } = await cols();
  let toolIds: Clinic["toolIds"], agentId = "";
  const versionDoc: Version[] = [];
  try {
    toolIds = await EL.createClinicTools(String(clinicId));
    const a = await EL.createReceptionist(card, Object.values(toolIds));
    agentId = a.agentId;
    const { prompt, firstMessage } = compile(card);
    const version: Version = {
      _id: new ObjectId(), clinicId, number: 1, card, prompt, firstMessage, branchId: a.mainBranchId, elVersionId: a.versionId,
      reason: "Created from the interview", status: "candidate", createdAt: new Date(),
    };
    await versions.insertOne(version);
    versionDoc.push(version);
    await saveTests(clinicId, defaultTests(card, toolIds, String(clinicId)));
    // Only now does the clinic count as created, so a failed approve can simply be retried.
    await clinics.updateOne({ _id: clinicId }, { $set: { card, agentId, mainBranchId: a.mainBranchId, toolIds, stage: "trial", updatedAt: new Date() } });
    return version;
  } catch (e) {
    const owned = await tests.find({ clinicId }).toArray();
    await EL.cleanup({ testIds: owned.map((t) => t.elTestId), agentId, toolIds: toolIds ? Object.values(toolIds) : [] });
    await tests.deleteMany({ clinicId });
    if (versionDoc[0]) await versions.deleteOne({ _id: versionDoc[0]._id });
    throw e;
  }
}

// Trial Day: every test, three runs each, on this exact version's branch.
export async function runVersion(versionId: ObjectId) {
  const { versions, tests, runs } = await cols();
  const v = await versions.findOne({ _id: versionId });
  if (!v) throw new HttpError(404, "Version not found");
  const c = await getClinic(v.clinicId);
  const all = await tests.find({ clinicId: v.clinicId }).sort({ createdAt: 1 }).toArray();
  const inv = await EL.runElTests(c.agentId!, all.map((t) => t.elTestId), v.branchId);
  const run: Run = {
    _id: new ObjectId(), clinicId: v.clinicId, versionId, invocationId: inv.id, status: "running",
    results: all.map((t) => ({ testId: String(t._id), elTestId: t.elTestId, passes: 0, total: 3, pending: 3, runs: [] })),
    passed: 0, total: all.length * 3, gate: false, createdAt: new Date(), updatedAt: new Date(),
  };
  await runs.insertOne(run);
  await versions.updateOne({ _id: versionId }, { $set: { lastRunId: run._id } });
  return refreshRun(run._id);
}

export async function refreshRun(runId: ObjectId) {
  const { runs, tests, versions } = await cols();
  const run = await runs.findOne({ _id: runId });
  if (!run) throw new HttpError(404, "Run not found");
  if (run.status !== "running") return run;
  if (Date.now() - run.createdAt.getTime() > 20 * 60_000) {
    const error = "ElevenLabs didn't finish these tests within 20 minutes. Run Trial Day again.";
    await runs.updateOne({ _id: runId }, { $set: { status: "error", error, updatedAt: new Date() } });
    return { ...run, status: "error" as const, error };
  }
  const inv = await EL.getInvocation(run.invocationId);
  const defs = new Map((await tests.find({ clinicId: run.clinicId }).toArray()).map((t) => [t.elTestId, t]));
  const results: RunResult[] = run.results.map((r) => {
    const tr = inv.testRuns.filter((x) => x.testId === r.elTestId);
    const mapped = tr.map((x) => ({
      status: x.status,
      transcript: (x.agentResponses || []).map((m) => ({ role: String(m.role), message: m.message || "" })).filter((m) => m.message),
      rationale: x.conditionResult?.rationale ? JSON.stringify(x.conditionResult.rationale).slice(0, 600) : undefined,
    }));
    return { ...r, runs: mapped, passes: mapped.filter((m) => m.status === "passed").length, pending: Math.max(0, 3 - mapped.filter((m) => m.status !== "pending").length) };
  });
  const done = inv.cancelled || results.every((r) => r.pending === 0);
  const passed = results.reduce((s, r) => s + r.passes, 0);
  const gate = done && results.every((r) => defs.get(r.elTestId)?.severity !== "blocker" || r.passes === 3);
  const next = { results, passed, gate, status: (done ? "done" : "running") as Run["status"], updatedAt: new Date() };
  await runs.updateOne({ _id: runId }, { $set: next });
  if (done) await versions.updateOne({ _id: run.versionId }, { $set: { passedGate: gate } });
  return { ...run, ...next };
}

async function newVersion(c: Clinic, card: JobCard, reason: string) {
  const { versions, clinics } = await cols();
  const last = await versions.find({ clinicId: c._id }).sort({ number: -1 }).limit(1).next();
  if (!last) throw new HttpError(409, "Create the receptionist first.");
  const n = last.number + 1;
  const { branchId, versionId } = await EL.createVersionBranch(c.agentId!, last.elVersionId, n, reason, card, toolList(c));
  const { prompt, firstMessage } = compile(card);
  const v: Version = { _id: new ObjectId(), clinicId: c._id, number: n, card, prompt, firstMessage, branchId, elVersionId: versionId, reason, status: "candidate", createdAt: new Date() };
  await versions.insertOne(v);
  await clinics.updateOne({ _id: c._id }, { $set: { card, updatedAt: new Date() } });
  return v;
}

// Coach: "If a price is not on the list, never guess…" → rule + version N+1 + permanent test.
export async function coach(clinicId: ObjectId, testId: string, correction: string, badReply: string) {
  const { tests } = await cols();
  const c = await getClinic(clinicId);
  const t = await tests.findOne({ _id: new ObjectId(testId), clinicId });
  if (!t) throw new HttpError(404, "Test not found");
  const rule = await coachToRule(c.card, { name: t.name, must: t.must, userLine: t.userLine, badReply }, correction);
  const card: JobCard = { ...c.card };
  const before = rule.field === "extraRule" ? "" : String(card[rule.field] || "");
  if (rule.field === "extraRule") card.extraRules = [...card.extraRules, rule.newText];
  else card[rule.field] = rule.newText;
  const v = await newVersion(c, JobCard.parse(card), `Coach: ${t.name.toLowerCase()} · ${rule.ruleSummary}`);
  const n = (await tests.countDocuments({ clinicId, fromCoach: true })) + 1;
  const [nt] = await saveTests(clinicId, [coachTest(v.card, String(clinicId), n, t.userLine, rule.testCondition, badReply)]);
  return { version: v, rule: { field: rule.field, before, after: rule.newText, summary: rule.ruleSummary }, test: nt };
}

export async function refine(clinicId: ObjectId, instruction: string) {
  const c = await getClinic(clinicId);
  const { card, summary } = await refineCard(c.card, instruction);
  const v = await newVersion(c, card, `Refine: ${summary}`);
  return { version: v, summary };
}

// Go live only when the exact version passed every blocker 3/3.
export async function goLive(versionId: ObjectId) {
  const { versions, clinics, runs } = await cols();
  const v = await versions.findOne({ _id: versionId });
  if (!v) throw new HttpError(404, "Version not found");
  const run = v.lastRunId && (await runs.findOne({ _id: v.lastRunId }));
  if (!run || run.status !== "done" || !run.gate) throw new HttpError(409, "This version hasn't passed every blocker test 3/3 yet.");
  const c = await getClinic(v.clinicId);
  await EL.mergeToMain(c.agentId!, v.branchId, c.mainBranchId!);
  await versions.updateMany({ clinicId: v.clinicId, status: "live" }, { $set: { status: "retired" } });
  await versions.updateOne({ _id: versionId }, { $set: { status: "live" } });
  await clinics.updateOne({ _id: v.clinicId }, { $set: { liveVersionId: versionId, stage: "live", updatedAt: new Date() } });
  return v;
}

// Observe: pull finished conversations from ElevenLabs and verify every booking against our calendar.
export async function ingestConversation(c: Clinic, conversationId: string, source: Call["source"] = "web") {
  const { calls, bookings, versions } = await cols();
  if (await calls.findOne({ conversationId })) return;
  const conv = await EL.getConversation(conversationId);
  if (conv.status !== "done" && conv.status !== "failed") return;
  const transcript = (conv.transcript || []).map((m) => ({ role: String(m.role), message: m.message || "", t: m.timeInCallSecs || 0 })).filter((m) => m.message);
  const toolsUsed = (conv.transcript || []).flatMap((m) => (m.toolCalls || []).map((tc) => tc.toolName || "")).filter(Boolean);
  const spokenIds = Array.from(new Set(transcript.flatMap((m) => m.message.match(/bk_[0-9a-f]{6}/gi) || []).map((s) => s.toLowerCase())));
  const real = spokenIds.length ? await bookings.find({ clinicId: c._id, bookingId: { $in: spokenIds } }).toArray() : [];
  const s = transcript.length ? await summarizeCall(transcript, toolsUsed) : { summary: "No conversation.", sentiment: "neutral" as const, outcome: "unresolved" as const, flag: "" };
  const v = conv.versionId ? await versions.findOne({ clinicId: c._id, elVersionId: conv.versionId }) : null;
  const verified = real.length === spokenIds.length;
  await calls.updateOne({ conversationId }, { $setOnInsert: {
    clinicId: c._id, conversationId, versionNumber: v?.number, startedAt: new Date((conv.metadata?.startTimeUnixSecs || Date.now() / 1000) * 1000),
    durationSecs: conv.metadata?.callDurationSecs || 0, transcript, summary: conv.analysis?.transcriptSummary || s.summary, outcome: s.outcome,
    sentiment: s.sentiment, bookingIds: spokenIds, bookingVerified: verified, flagged: !!s.flag || !verified || s.outcome === "needs_you",
    flagReason: !verified ? "Agent mentioned a booking ID that isn't in the calendar" : s.flag || undefined, source,
  } }, { upsert: true });
}

export async function syncCalls(clinicId: ObjectId) {
  const c = await getClinic(clinicId);
  if (!c.agentId) return 0;
  const list = await EL.listConversations(c.agentId);
  let n = 0;
  for (const conv of list) {
    try { await ingestConversation(c, conv.conversationId); n++; } catch { /* one bad conversation shouldn't block the log */ }
  }
  return n;
}
