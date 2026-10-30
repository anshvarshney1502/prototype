import { route } from "@/lib/api";
import { oid } from "@/lib/db";
import { goLive } from "@/lib/workflow";

export const POST = route<{ vid: string }>(async (_req, { vid }) => {
  const v = await goLive(oid(vid));
  return { live: v.number };
});
