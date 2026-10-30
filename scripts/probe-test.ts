// Runs one Trial Day test (by key) against a throwaway agent and prints the transcript and rationale.
// Run: npx tsx --conditions=react-server --env-file=.env.local scripts/probe-test.ts patient_in_pain
import * as EL from "../src/lib/elevenlabs";
import { defaultTests } from "../src/lib/testpack";
import { JobCard } from "../src/lib/jobcard";

const key = process.argv[2] || "patient_in_pain";
const card = JobCard.parse({
  clinicName: "Sharma Dental Clinic", business: "Sharma Dental Clinic, Indirapuram. Mon–Sat 10 am–2 pm and 5–8:30 pm",
  mainJobs: "Answer questions about services and prices; book appointments",
  approvedPrices: [{ item: "scaling", price: "₹1,200" }, { item: "filling", price: "₹1,500" }],
  booking: "30-minute slots.", languages: ["en", "hi"],
  handoff: "Patient mentions pain, swelling or bleeding, or is upset. Take a number for a callback within 30 minutes.",
  never: "Diagnose or suggest medicine.", ifUnsure: "",
});
const c = EL.el().conversationalAi;
let agent = "", tools: string[] = [], test = "";

(async () => {
  try {
    const t = await EL.createClinicTools("probe0000000000000000000");
    tools = Object.values(t);
    agent = (await EL.createReceptionist(card, tools)).agentId;
    const spec = defaultTests(card, t, "probe0000000000000000000").find((x) => x.key === key)!;
    test = await EL.createElTest(spec.body);
    const inv = await EL.runElTests(agent, [test]);
    for (let i = 0; i < 40; i++) {
      await new Promise((r) => setTimeout(r, 4000));
      const g = await EL.getInvocation(inv.id);
      if (g.testRuns.every((r) => r.status !== "pending")) {
        for (const r of g.testRuns) {
          console.log("status:", r.status);
          console.log("responses:", JSON.stringify(r.agentResponses?.map((m) => ({ role: m.role, message: m.message, tools: m.toolCalls?.map((tc) => ({ name: tc.toolName, params: tc.paramsAsJson })) })), null, 1).slice(0, 2500));
          console.log("condition:", JSON.stringify(r.conditionResult).slice(0, 800));
        }
        break;
      }
    }
  } catch (e) {
    console.error("FAILED", (e as Error).message, JSON.stringify((e as { body?: unknown }).body ?? "").slice(0, 800));
  } finally {
    if (test) await c.tests.delete(test).catch(() => {});
    if (agent) await c.agents.delete(agent).catch(() => {});
    for (const id of tools) await c.tools.delete(id, { force: true }).catch(() => {});
    console.log("cleaned up");
  }
})();
