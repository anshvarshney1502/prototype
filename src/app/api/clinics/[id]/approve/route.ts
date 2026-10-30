import { route, body } from "@/lib/api";
import { oid } from "@/lib/db";
import { approve } from "@/lib/workflow";

export const maxDuration = 120;

export const POST = route<{ id: string }>(async (req, { id }) => {
  const { card } = await body<{ card: unknown }>(req);
  const v = await approve(oid(id), card);
  return { versionId: String(v._id) };
});
