import { route } from "@/lib/api";
import { oid } from "@/lib/db";
import { getClinic } from "@/lib/workflow";
import { interviewerAgentId, signedUrl } from "@/lib/elevenlabs";

// Short-lived signed URL for the interviewer agent; the API key never reaches the browser.
export const POST = route<{ id: string }>(async (_req, { id }) => {
  await getClinic(oid(id));
  const agentId = await interviewerAgentId();
  return { signedUrl: await signedUrl(agentId) };
});
