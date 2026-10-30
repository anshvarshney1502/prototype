// Smoke test of the ElevenLabs side of the loop (no MongoDB): tools → agent → 8 tests → run → branch → cleanup.
// Run: npx tsx --conditions=react-server --env-file=.env.local scripts/smoke-elevenlabs.ts
import * as EL from "../src/lib/elevenlabs";
import { defaultTests } from "../src/lib/testpack";
import { JobCard } from "../src/lib/jobcard";

const card = JobCard.parse({
  clinicName: "Sharma Dental Clinic",
  business: "Sharma Dental Clinic, Indirapuram. Mon–Sat 10 am–2 pm and 5–8:30 pm",
  mainJobs: "Answer questions about services and prices; check free slots; book appointments",
  approvedPrices: [{ item: "scaling", price: "₹1,200" }, { item: "filling", price: "₹1,500" }, { item: "root canal", price: "from ₹6,000" }],
  booking: "30-minute slots. Confirm only after the calendar returns a booking.",
  languages: ["en", "hi"],
  handoff: "Patient mentions pain, swelling or bleeding, or is upset. Take a number for a callback within 30 minutes.",
  never: "Diagnose, suggest medicine, or share another patient's details.",
  ifUnsure: "",
});

const created: { tools: string[]; agent?: string; tests: string[] } = { tools: [], tests: [] };
const step = (s: string) => console.log(`\n▶ ${s}`);

async function main() {
  step("create server tools");
  const tools = await EL.createClinicTools("smoketest000000000000000");
  created.tools = Object.values(tools);
  console.log(tools);

  step("pick an Indian-accent library voice");
  const voices = await EL.sharedIndianVoices();
  console.log(voices.slice(0, 3).map((v) => `${v.name} (${v.labels.gender})`).join(", "));
  if (voices[0]) Object.assign(card, await EL.ensureVoice({ ...card, voiceId: voices[0].id, voiceName: voices[0].name, voiceOwner: voices[0].owner }));
  console.log("voice in workspace:", card.voiceId);

  step("create receptionist agent (version 1)");
  const a = await EL.createReceptionist(card, created.tools);
  created.agent = a.agentId;
  console.log(a);

  step("create the 8 Trial Day tests");
  for (const t of defaultTests(card, tools, "smoketest000000000000000")) {
    const id = await EL.createElTest(t.body);
    created.tests.push(id);
    console.log(`  ${t.key.padEnd(20)} ${t.kind.padEnd(10)} ${id}`);
  }

  step("run all tests ×3 on main");
  const inv = await EL.runElTests(a.agentId, created.tests, a.mainBranchId);
  console.log("invocation", inv.id, "runs queued:", inv.testRuns.length);
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 5000));
    const g = await EL.getInvocation(inv.id);
    const pending = g.testRuns.filter((r) => r.status === "pending").length;
    process.stdout.write(`  poll ${i}: ${g.testRuns.length - pending}/${g.testRuns.length} finished\n`);
    if (pending === 0) {
      const by = new Map<string, string[]>();
      for (const r of g.testRuns) by.set(r.testName || r.testId, [...(by.get(r.testName || r.testId) || []), r.status]);
      for (const [k, v] of by) console.log(`  ${k}: ${v.join(", ")}`);
      const sample = g.testRuns.find((r) => r.status === "failed") || g.testRuns[0];
      console.log("  sample transcript:", JSON.stringify((sample.agentResponses || []).map((m) => [m.role, m.message])).slice(0, 600));
      console.log("  sample rationale:", JSON.stringify(sample.conditionResult).slice(0, 400));
      break;
    }
  }

  step("coach → version 2 on its own branch");
  const card2 = { ...card, ifUnsure: "If a price is not on the approved list, never guess. Say you can't confirm it and offer a callback." };
  const v2 = await EL.createVersionBranch(a.agentId, a.versionId, 2, "Coach: unknown price", JobCard.parse(card2), created.tools);
  console.log(v2);

  step("signed URL for the version-2 branch (live test mode)");
  const url = await EL.signedUrl(a.agentId, v2.branchId);
  console.log(url.slice(0, 60) + "…");

  step("merge version 2 into main (go live)");
  await EL.mergeToMain(a.agentId, v2.branchId, a.mainBranchId);
  console.log("merged");
}

async function cleanup() {
  step("cleanup");
  const c = EL.el().conversationalAi;
  for (const t of created.tests) await c.tests.delete(t).catch((e: unknown) => console.log("  test delete failed", t, (e as Error)?.message));
  if (created.agent) await c.agents.delete(created.agent).catch((e: unknown) => console.log("  agent delete failed", (e as Error)?.message));
  for (const t of created.tools) await c.tools.delete(t, { force: true }).catch((e: unknown) => console.log("  tool delete failed", t, (e as Error)?.message));
  console.log("  removed", created.tests.length, "tests,", created.agent ? 1 : 0, "agent,", created.tools.length, "tools");
}

main()
  .catch((e) => { console.error("\n✕ FAILED:", e?.message, JSON.stringify(e?.body ?? "").slice(0, 1500)); process.exitCode = 1; })
  .finally(cleanup);
