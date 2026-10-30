import { route } from "@/lib/api";
import { oid, HttpError } from "@/lib/db";
import { getClinic } from "@/lib/workflow";
import { signedUrl } from "@/lib/elevenlabs";

// Public share link: patients only ever reach the live (tested) version on the main branch.
export const POST = route<{ id: string }>(async (_req, { id }) => {
  const c = await getClinic(oid(id));
  if (!c.agentId || c.stage !== "live") throw new HttpError(409, "This receptionist isn't live yet.");
  return { signedUrl: await signedUrl(c.agentId, c.mainBranchId), clinicName: c.card.clinicName };
});
