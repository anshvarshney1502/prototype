import { route } from "@/lib/api";
import { oid } from "@/lib/db";
import { getClinic } from "@/lib/workflow";
import { requireOwner } from "@/lib/owner";
import { interviewerAgentId, signedUrl } from "@/lib/elevenlabs";

// Short-lived signed URL for the interviewer agent; the API key never reaches the browser.
export const POST = route<{ id: string }>(async (req, { id }) => {
  requireOwner(req, id);
  await getClinic(oid(id));
  const agentId = await interviewerAgentId();
  return { signedUrl: await signedUrl(agentId) };
});
