import { route } from "@/lib/api";
import { searchVoices, sharedIndianVoices } from "@/lib/elevenlabs";
import { ownedIds } from "@/lib/owner";
import { HttpError } from "@/lib/db";

// Voice browser: Indian-accent conversational voices from the library, plus search over the workspace's voices.
export const GET = route(async (req) => {
  if (!ownedIds(req).length) throw new HttpError(403, "Create a receptionist first.");
  const q = new URL(req.url).searchParams.get("q")?.slice(0, 60) || "";
  const [lib, mine] = await Promise.all([sharedIndianVoices().catch(() => []), q ? searchVoices(q).catch(() => []) : Promise.resolve([])]);
  return { voices: [...mine, ...lib].slice(0, 36) };
});
