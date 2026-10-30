import { route } from "@/lib/api";
import { oid } from "@/lib/db";
import { goLive } from "@/lib/workflow";
import { ownerOfVersion } from "@/lib/owner";

export const POST = route<{ vid: string }>(async (req, { vid }) => {
  await ownerOfVersion(req, oid(vid));
  const v = await goLive(oid(vid));
  return { live: v.number };
});
