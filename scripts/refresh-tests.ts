// Re-applies the current test pack definitions to an existing clinic's ElevenLabs tests (keeps IDs and history).
// Run: npx tsx --conditions=react-server --env-file=.env.local scripts/refresh-tests.ts <clinicId>
import { cols, oid } from "../src/lib/db";
import { el } from "../src/lib/elevenlabs";
import { defaultTests } from "../src/lib/testpack";
(async () => {
  const id = process.argv[2];
  const { clinics, tests } = await cols();
  const c = await clinics.findOne({ _id: oid(id) });
  if (!c?.toolIds) throw new Error("clinic has no tools");
  const specs = defaultTests(c.card, c.toolIds, id);
  for (const t of await tests.find({ clinicId: c._id, fromCoach: { $ne: true } }).toArray()) {
    const s = specs.find((x) => x.key === t.key);
    if (!s || s.kind !== "simulation") continue;
    await el().conversationalAi.tests.update(t.elTestId, s.body as never);
    await tests.updateOne({ _id: t._id }, { $set: { must: s.must } });
    console.log("updated", t.key);
  }
  process.exit(0);
})().catch((e) => { console.error(e?.message, JSON.stringify(e?.body ?? "").slice(0, 800)); process.exit(1); });
