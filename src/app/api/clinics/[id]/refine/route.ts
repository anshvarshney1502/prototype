import { route, body, str } from "@/lib/api";
import { oid } from "@/lib/db";
import { refine } from "@/lib/workflow";

export const maxDuration = 120;

// Refine in plain language ("make the greeting shorter and warmer", "add Hindi"). Each change is a new, untested version.
export const POST = route<{ id: string }>(async (req, { id }) => {
  const { instruction } = await body<{ instruction: string }>(req);
  const r = await refine(oid(id), str(instruction, 600));
  return { versionId: String(r.version._id), number: r.version.number, summary: r.summary };
});
