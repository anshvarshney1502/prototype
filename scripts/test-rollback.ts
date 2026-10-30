// Proves Approve is all-or-nothing: force a failure after the booking tools exist (bad voice id),
// then check nothing is left on ElevenLabs or in the clinic, and that a retry works.
// Run with the dev server up: npx tsx --conditions=react-server --env-file=.env.local scripts/test-rollback.ts
import assert from "node:assert/strict";
import { el } from "../src/lib/elevenlabs";
import { cols, oid } from "../src/lib/db";

const B = process.env.BASE || "http://localhost:3000";
let cookie = "";
async function api(path: string, init: RequestInit & { json?: unknown } = {}) {
  const r = await fetch(B + path, {
    ...init, method: init.method ?? (init.json !== undefined ? "POST" : "GET"),
    headers: { ...(init.json !== undefined ? { "content-type": "application/json" } : {}), cookie },
    body: init.json !== undefined ? JSON.stringify(init.json) : undefined,
  });
  const set = r.headers.getSetCookie?.() ?? [];
  if (set.length) cookie = set.map((c) => c.split(";")[0]).join("; ");
  return { status: r.status, body: await r.json().catch(() => ({})) };
}
const toolsFor = async (id: string) => {
  const r = await el().conversationalAi.tools.list({});
  return r.tools.filter((t) => JSON.stringify(t.toolConfig).includes(`/api/tools/${id}/`));
};

(async () => {
  const created = await api("/api/clinics", { json: { clinicName: "Rollback Test Dental" } });
  const id = created.body.id as string;
  console.log("clinic", id);
  const badCard = { clinicName: "Rollback Test Dental", languages: ["en"], voiceId: "this_voice_does_not_exist", voiceName: "bogus" };

  const bad = await api(`/api/clinics/${id}/approve`, { json: { card: badCard } });
  console.log("approve with a bad voice →", bad.status, String(bad.body.error).slice(0, 120));
  assert.ok(bad.status >= 400, "bad approve must fail");

  const { clinics, versions, tests } = await cols();
  const c = await clinics.findOne({ _id: oid(id) });
  assert.equal(c?.agentId, undefined, "clinic must not be marked created");
  assert.equal(await versions.countDocuments({ clinicId: oid(id) }), 0, "no version left behind");
  assert.equal(await tests.countDocuments({ clinicId: oid(id) }), 0, "no tests left behind");
  const leftovers = await toolsFor(id);
  assert.equal(leftovers.length, 0, `${leftovers.length} booking tools left on ElevenLabs`);
  console.log("✓ nothing left behind (DB or ElevenLabs)");

  const good = await api(`/api/clinics/${id}/approve`, { json: { card: { ...badCard, voiceId: "", voiceName: "" } } });
  console.log("retry with default voice →", good.status);
  assert.equal(good.status, 200, JSON.stringify(good.body));
  const c2 = await clinics.findOne({ _id: oid(id) });
  assert.ok(c2?.agentId, "agent created on retry");
  assert.equal(await tests.countDocuments({ clinicId: oid(id) }), 8, "8 tests after retry");
  console.log("✓ retry created the agent and 8 tests");

  // cleanup the test receptionist
  const ts = await tests.find({ clinicId: oid(id) }).toArray();
  const { cleanup } = await import("../src/lib/elevenlabs");
  await cleanup({ testIds: ts.map((t) => t.elTestId), agentId: c2!.agentId, toolIds: Object.values(c2!.toolIds!) });
  await tests.deleteMany({ clinicId: oid(id) }); await versions.deleteMany({ clinicId: oid(id) }); await clinics.deleteOne({ _id: oid(id) });
  console.log("rollback test passed, cleaned up");
  process.exit(0);
})().catch((e) => { console.error("FAILED:", e?.message ?? e); process.exit(1); });
