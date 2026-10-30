import { route } from "@/lib/api";
import { oid } from "@/lib/db";
import { runVersion } from "@/lib/workflow";
import { ownerOfVersion } from "@/lib/owner";

export const maxDuration = 60;

export const POST = route<{ vid: string }>(async (req, { vid }) => {
  await ownerOfVersion(req, oid(vid));
  const run = await runVersion(oid(vid));
  return { runId: String(run._id), run };
});
