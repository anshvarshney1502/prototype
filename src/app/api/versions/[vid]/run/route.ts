import { route } from "@/lib/api";
import { oid } from "@/lib/db";
import { runVersion } from "@/lib/workflow";

export const maxDuration = 60;

export const POST = route<{ vid: string }>(async (_req, { vid }) => {
  const run = await runVersion(oid(vid));
  return { runId: String(run._id), run };
});
