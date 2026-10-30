import { route, body } from "@/lib/api";
import { cols, oid, HttpError } from "@/lib/db";
import { getClinic } from "@/lib/workflow";
import { signedUrl } from "@/lib/elevenlabs";
import { requireOwner } from "@/lib/owner";

// Live test mode: talk to a specific version (its branch) before it goes live.
export const POST = route<{ id: string }>(async (req, { id }) => {
  requireOwner(req, id);
  const _id = oid(id);
  const c = await getClinic(_id);
  if (!c.agentId) throw new HttpError(409, "Create the receptionist first.");
  const { versionId } = await body<{ versionId?: string }>(req);
  const { versions } = await cols();
  const v = versionId ? await versions.findOne({ _id: oid(versionId), clinicId: _id }) : null;
  return { signedUrl: await signedUrl(c.agentId, v?.branchId), versionNumber: v?.number };
});
