// Finds the parameter-path format Agent Testing expects for webhook tool body fields.
import * as EL from "../src/lib/elevenlabs";
import { JobCard } from "../src/lib/jobcard";
import { compile } from "../src/lib/compile";
const card = JobCard.parse({ clinicName: "Sharma Dental Clinic", languages: ["en", "hi"], handoff: "Patient mentions pain or swelling: take a number and log an urgent callback.", never: "Never give medical advice." });
const c = EL.el().conversationalAi; let agent = ""; let tools: string[] = []; const tests: string[] = [];
(async () => {
  try {
    const t = await EL.createClinicTools("probe0000000000000000000"); tools = Object.values(t);
    agent = (await EL.createReceptionist(card, tools)).agentId;
    const { firstMessage } = compile(card);
    const paths = ["urgent", "$.urgent", "body.urgent", "request_body.urgent", "requestBody.urgent", "body_params.urgent"];
    const names: Record<string, string> = {};
    for (const p of paths) {
      const id = await EL.createElTest({ type: "tool", name: `probe path ${p}`, chatHistory: [{ role: "agent", message: firstMessage, timeInCallSecs: 0 }, { role: "user", message: "This is Ramesh, 98765 43210. My tooth hurts badly and my cheek is swollen.", timeInCallSecs: 4 }],
        toolCallParameters: { referencedTool: { id: t.logCallback, type: "webhook" }, parameters: [{ path: p, eval: { type: "exact", expectedValue: "true" } }] } });
      tests.push(id); names[id] = p;
    }
    const inv = await EL.runElTests(agent, tests);
    for (let i = 0; i < 40; i++) {
      await new Promise((r) => setTimeout(r, 4000));
      const g = await EL.getInvocation(inv.id);
      if (g.testRuns.every((r) => r.status !== "pending")) { for (const r of g.testRuns) console.log(names[r.testId].padEnd(22), r.status, JSON.stringify(r.conditionResult?.rationale).slice(0, 140)); break; }
    }
  } catch (e) { console.error("FAILED", (e as Error).message, JSON.stringify((e as { body?: unknown }).body ?? "").slice(0, 600)); }
  finally {
    for (const id of tests) await c.tests.delete(id).catch(() => {});
    if (agent) await c.agents.delete(agent).catch(() => {});
    for (const id of tools) await c.tools.delete(id, { force: true }).catch(() => {});
    console.log("cleaned up");
  }
})();
