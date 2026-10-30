import { ObjectId } from "mongodb";
import { route, body } from "@/lib/api";
import { cols } from "@/lib/db";
import { describeToCard } from "@/lib/gemini";
import { emptyCard } from "@/lib/jobcard";

// Write stage: start from a typed description (Gemini drafts the card) or a blank card for the voice interview.
export const POST = route(async (req) => {
  const { description, clinicName } = await body<{ description?: string; clinicName?: string }>(req);
  const text = typeof description === "string" ? description.trim().slice(0, 1200) : "";
  const card = text ? await describeToCard(text) : emptyCard(clinicName?.slice(0, 80) || "My clinic");
  const { clinics } = await cols();
  const _id = new ObjectId();
  await clinics.insertOne({ _id, card, stage: text ? "jobcard" : "interview", createdAt: new Date(), updatedAt: new Date() });
  return { id: String(_id), stage: text ? "jobcard" : "interview" };
});

export const GET = route(async () => {
  const { clinics } = await cols();
  const list = await clinics.find({}, { projection: { card: { clinicName: 1 }, stage: 1, updatedAt: 1 } }).sort({ updatedAt: -1 }).limit(20).toArray();
  return list.map((c) => ({ id: String(c._id), name: c.card.clinicName, stage: c.stage, updatedAt: c.updatedAt }));
});
