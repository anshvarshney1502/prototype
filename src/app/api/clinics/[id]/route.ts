import { route, body } from "@/lib/api";
import { cols, oid, HttpError } from "@/lib/db";
import { JobCard } from "@/lib/jobcard";
import { getClinic } from "@/lib/workflow";
import { requireOwner } from "@/lib/owner";

// Everything the workspace needs in one read.
export const GET = route<{ id: string }>(async (req, { id }) => {
  const _id = oid(id);
  requireOwner(req, _id);
  const c = await getClinic(_id);
  const { versions, tests, runs, bookings, callbacks } = await cols();
  const [vs, ts, rs, bk, cb] = await Promise.all([
    versions.find({ clinicId: _id }).sort({ number: 1 }).toArray(),
    tests.find({ clinicId: _id }).sort({ createdAt: 1 }).toArray(),
    runs.find({ clinicId: _id }).sort({ createdAt: -1 }).limit(20).toArray(),
    bookings.find({ clinicId: _id, status: "confirmed" }).sort({ start: 1 }).limit(50).toArray(),
    callbacks.find({ clinicId: _id }).sort({ createdAt: -1 }).limit(50).toArray(),
  ]);
  return { clinic: c, versions: vs, tests: ts, runs: rs, bookings: bk, callbacks: cb };
});

// Visual editor before the receptionist exists. After that, edits go through Refine so they become a tested version.
export const PATCH = route<{ id: string }>(async (req, { id }) => {
  const _id = oid(id);
  requireOwner(req, _id);
  const c = await getClinic(_id);
  if (c.agentId) throw new HttpError(409, "The receptionist already exists. Save edits as a new version instead.");
  const { card } = await body<{ card: unknown }>(req);
  const parsed = JobCard.parse(card);
  const { clinics } = await cols();
  await clinics.updateOne({ _id }, { $set: { card: parsed, updatedAt: new Date() } });
  return { card: parsed };
});
