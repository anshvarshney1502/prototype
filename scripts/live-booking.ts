// Real booking through the live site: a simulated caller talks to the live agent with NO tool mocks,
// so ElevenLabs calls the deployed /api/tools endpoints and MongoDB must end up with the booking.
// Run: npx tsx --conditions=react-server --env-file=.env.local scripts/live-booking.ts <clinicId>
import { cols, oid } from "../src/lib/db";
import { el, createElTest, runElTests, getInvocation } from "../src/lib/elevenlabs";

(async () => {
  const id = process.argv[2];
  const { clinics, bookings } = await cols();
  const c = await clinics.findOne({ _id: oid(id) });
  if (!c?.agentId) throw new Error("no agent");
  const before = await bookings.countDocuments({ clinicId: c._id });
  const test = await createElTest({
    type: "simulation", name: `munshi live booking ${id.slice(-6)}`, simulationMaxTurns: 10,
    simulationScenario: "You are Anjali (phone 98111 22334). Book a teeth cleaning on Thursday 5 November 2026 at 5:30 pm. Give details when asked. Accept another time on the same day if 5:30 isn't free.",
    successCondition: "The agent booked an appointment via book_slot and read back a booking ID starting with bk_ that the tool returned.",
    toolMockConfig: { mockingStrategy: "none" },
  });
  try {
    const inv = await runElTests(c.agentId, [test], c.mainBranchId);
    for (let i = 0; i < 50; i++) {
      await new Promise((r) => setTimeout(r, 5000));
      const g = await getInvocation(inv.id);
      if (g.testRuns.every((r) => r.status !== "pending")) {
        for (const r of g.testRuns) {
          console.log("status:", r.status);
          for (const m of r.agentResponses || []) {
            if (m.message) console.log(`  ${m.role}: ${m.message}`);
            for (const tc of m.toolCalls || []) console.log(`  [tool ${tc.toolName}] ${tc.paramsAsJson}`);
            for (const tr of (m.toolResults || []) as { toolName?: string; resultValue?: string }[]) console.log(`  [result ${tr.toolName}] ${String(tr.resultValue).slice(0, 200)}`);
          }
        }
        break;
      }
    }
    const after = await bookings.find({ clinicId: c._id }).sort({ createdAt: -1 }).toArray();
    console.log(`bookings in MongoDB: ${before} → ${after.length}`, after[0] ? `latest ${after[0].bookingId} ${after[0].patientName} ${after[0].start.toISOString()}` : "");
  } finally {
    await el().conversationalAi.tests.delete(test).catch(() => {});
    process.exit(0);
  }
})().catch((e) => { console.error(e?.message, JSON.stringify(e?.body ?? "").slice(0, 600)); process.exit(1); });
