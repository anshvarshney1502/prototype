import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { route, body } from "@/lib/api";
import { cols, HttpError, oid } from "@/lib/db";
import { describeToCard } from "@/lib/gemini";
import { emptyCard } from "@/lib/jobcard";
import { ipHash, ownedIds, ownerSetCookie } from "@/lib/owner";

export const maxDuration = 90;

const MAX_PER_HOUR = 20;

// Write stage: start from a typed description (Gemini drafts the card) or a blank card for the voice interview.
export const POST = route(async (req) => {
  const { description, clinicName } = await body<{ description?: string; clinicName?: string }>(req);
  const text = typeof description === "string" ? description.trim().slice(0, 1200) : "";
  const { clinics } = await cols();
  const ip = ipHash(req);
  if ((await clinics.countDocuments({ ipHash: ip, createdAt: { $gt: new Date(Date.now() - 3_600_000) } })) >= MAX_PER_HOUR)
    throw new HttpError(429, "Too many receptionists created from this connection. Try again in an hour.");
  const card = text ? await describeToCard(text) : emptyCard(clinicName?.slice(0, 80) || "My business");
  const _id = new ObjectId();
  await clinics.insertOne({ _id, card, stage: text ? "jobcard" : "interview", ipHash: ip, createdAt: new Date(), updatedAt: new Date() });
  const res = NextResponse.json({ id: String(_id), stage: text ? "jobcard" : "interview" });
  res.headers.append("set-cookie", ownerSetCookie(String(_id)));
  return res;
});

// Only the receptionists this browser owns.
export const GET = route(async (req) => {
  const ids = ownedIds(req).map(oid);
  if (!ids.length) return [];
  const { clinics } = await cols();
  const list = await clinics.find({ _id: { $in: ids } }, { projection: { card: { clinicName: 1 }, stage: 1, updatedAt: 1 } }).sort({ updatedAt: -1 }).limit(20).toArray();
  return list.map((c) => ({ id: String(c._id), name: c.card.clinicName, stage: c.stage, updatedAt: c.updatedAt }));
});
