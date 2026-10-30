import { route } from "@/lib/api";
import { oid } from "@/lib/db";
import { refreshRun } from "@/lib/workflow";
import { ownerOfRun } from "@/lib/owner";

// The UI polls this while ElevenLabs Agent Testing works through 3 runs of every test.
export const GET = route<{ rid: string }>(async (req, { rid }) => {
  await ownerOfRun(req, oid(rid));
  return refreshRun(oid(rid));
});
