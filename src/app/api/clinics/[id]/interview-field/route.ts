import { route, body, str } from "@/lib/api";
import { cols, oid, HttpError } from "@/lib/db";
import { INTERVIEW_FIELDS, JobCard } from "@/lib/jobcard";
import { normalizeInterviewValue } from "@/lib/gemini";
import { getClinic } from "@/lib/workflow";

// Called by the interviewer's update_job_card client tool: one spoken answer → one validated job-card line.
export const POST = route<{ id: string }>(async (req, { id }) => {
  const _id = oid(id);
  const { field, value } = await body<{ field: string; value: string }>(req);
  if (!INTERVIEW_FIELDS.some((f) => f.key === field)) throw new HttpError(400, "Unknown job card field.");
  const c = await getClinic(_id);
  if (c.agentId) throw new HttpError(409, "The receptionist already exists.");
  const raw = typeof value === "string" ? value : "";
  const v = normalizeInterviewValue(field, raw);
  const next: Record<string, unknown> = { ...c.card, [field]: v };
  if (field === "business" && raw.trim()) {
    next.clinicName = c.card.clinicName === "My clinic" ? raw.split(/[,.]/)[0].trim().slice(0, 80) || c.card.clinicName : c.card.clinicName;
    const hours = raw.match(/(mon|tue|wed|thu|fri|sat|sun|monday|daily|\d{1,2}\s*(am|pm)|\d{1,2}\s*(to|-|–)\s*\d)/i) ? raw : "";
    if (hours) next.hours = raw.slice(0, 200);
  }
  if (field !== "ifUnsure" && field !== "languages") str(raw, 600);
  const card = JobCard.parse(next);
  const { clinics } = await cols();
  await clinics.updateOne({ _id }, { $set: { card, stage: "interview", updatedAt: new Date() } });
  return { card, field };
});
