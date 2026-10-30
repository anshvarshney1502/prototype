import { route } from "@/lib/api";
import { HttpError } from "@/lib/db";
import { transcribe } from "@/lib/elevenlabs";
import { ownedIds } from "@/lib/owner";

export const maxDuration = 60;

// "Say it instead" on the Coach screen: Scribe v2 turns the owner's spoken fix into text.
export const POST = route(async (req) => {
  if (!ownedIds(req).length) throw new HttpError(403, "Create a receptionist first.");
  const form = await req.formData().catch(() => null);
  const file = form?.get("audio");
  if (!(file instanceof Blob) || file.size === 0) throw new HttpError(400, "No audio received.");
  if (file.size > 10_000_000) throw new HttpError(413, "Recording is too long.");
  return { text: await transcribe(file) };
});
