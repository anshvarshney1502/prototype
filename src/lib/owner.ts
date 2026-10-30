import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { ObjectId } from "mongodb";
import { cols, HttpError } from "./db";
import { env } from "./env";

// Stateless ownership: whoever created a clinic gets an httpOnly cookie holding HMAC(secret, clinicId).
// Every owner-facing route checks it, so a guessed or leaked clinic ID alone can't change or run anything.
const secret = () => process.env.OWNER_SECRET || env.toolSecret;
const token = (id: string) => createHmac("sha256", secret()).update(`owner:${id}`).digest("hex");
const cookieName = (id: string) => `munshi_${id}`;

export function ownerSetCookie(id: string) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${cookieName(id)}=${token(id)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000${secure}`;
}

function cookies(req: Request) {
  const out = new Map<string, string>();
  for (const part of (req.headers.get("cookie") || "").split(";")) {
    const i = part.indexOf("=");
    if (i > 0) out.set(part.slice(0, i).trim(), part.slice(i + 1).trim());
  }
  return out;
}

function valid(req: Request, id: string) {
  const got = cookies(req).get(cookieName(id));
  if (!got) return false;
  const a = Buffer.from(got), b = Buffer.from(token(id));
  return a.length === b.length && timingSafeEqual(a, b);
}

export function requireOwner(req: Request, id: string | ObjectId) {
  if (!valid(req, String(id))) throw new HttpError(403, "You don't have access to this receptionist on this browser.");
}

export function ownedIds(req: Request) {
  return [...cookies(req).keys()].filter((k) => /^munshi_[0-9a-f]{24}$/.test(k)).map((k) => k.slice(7)).filter((id) => valid(req, id));
}

// Versions and runs belong to a clinic; resolve it, then check the cookie.
export async function ownerOfVersion(req: Request, versionId: ObjectId) {
  const { versions } = await cols();
  const v = await versions.findOne({ _id: versionId }, { projection: { clinicId: 1 } });
  if (!v) throw new HttpError(404, "Version not found");
  requireOwner(req, v.clinicId);
}
export async function ownerOfRun(req: Request, runId: ObjectId) {
  const { runs } = await cols();
  const r = await runs.findOne({ _id: runId }, { projection: { clinicId: 1 } });
  if (!r) throw new HttpError(404, "Run not found");
  requireOwner(req, r.clinicId);
}

// Best-effort cap on clinic creation per visitor (each one costs Gemini and ElevenLabs credits).
export const ipHash = (req: Request) =>
  createHash("sha256").update((req.headers.get("x-forwarded-for") || "local").split(",")[0].trim() + secret()).digest("hex").slice(0, 24);
