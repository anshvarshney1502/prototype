import { route, body, str } from "@/lib/api";
import { oid } from "@/lib/db";
import { coach } from "@/lib/workflow";
import { requireOwner } from "@/lib/owner";

export const maxDuration = 120;

export const POST = route<{ id: string }>(async (req, { id }) => {
  requireOwner(req, id);
  const b = await body<{ testId: string; correction: string; badReply?: string }>(req);
  const r = await coach(oid(id), str(b.testId, 40), str(b.correction, 600), typeof b.badReply === "string" ? b.badReply.slice(0, 800) : "");
  return { versionId: String(r.version._id), number: r.version.number, rule: r.rule, testId: String(r.test._id) };
});
