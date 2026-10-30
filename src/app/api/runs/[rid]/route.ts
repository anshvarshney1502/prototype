import { route } from "@/lib/api";
import { oid } from "@/lib/db";
import { refreshRun } from "@/lib/workflow";

// The UI polls this while ElevenLabs Agent Testing works through 3 runs of every test.
export const GET = route<{ rid: string }>(async (_req, { rid }) => refreshRun(oid(rid)));
