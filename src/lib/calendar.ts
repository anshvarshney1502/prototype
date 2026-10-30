import "server-only";
import { randomBytes } from "node:crypto";
import type { ObjectId } from "mongodb";
import { cols } from "./db";

// Built-in clinic calendar. Times are India local (UTC+5:30); a booking exists only with a bk_ id from here.
const IST = 330; // minutes
const SLOT_MIN = 30;
// Default clinic hours from the deck: Mon–Sat 10–2 and 5–8:30.
const SESSIONS: [number, number][] = [[10 * 60, 14 * 60], [17 * 60, 20 * 60 + 30]];

export function parseLocal(s: string): Date | null {
  const m = s.trim().match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{1,2}):(\d{2}))?/);
  if (!m) return null;
  const [, y, mo, d, h = "0", mi = "0"] = m;
  return new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi) - IST * 60_000);
}
export function fmtLocal(d: Date) {
  const l = new Date(d.getTime() + IST * 60_000);
  return l.toISOString().slice(0, 16);
}

export async function freeSlots(clinicId: ObjectId, dateStr: string): Promise<{ date?: string; free?: string[]; note?: string; error?: string }> {
  const day = parseLocal(dateStr.slice(0, 10));
  if (!day) return { error: "Send the date as YYYY-MM-DD." };
  const localDay = new Date(day.getTime() + IST * 60_000);
  if (localDay.getUTCDay() === 0) return { date: dateStr.slice(0, 10), free: [], note: "The clinic is closed on Sunday." };
  const { bookings } = await cols();
  const taken = new Set(
    (await bookings.find({ clinicId, status: "confirmed", start: { $gte: day, $lt: new Date(day.getTime() + 86_400_000) } }).toArray()).map((b) => b.start.getTime()),
  );
  const now = Date.now();
  const free: string[] = [];
  for (const [a, b] of SESSIONS) for (let m = a; m + SLOT_MIN <= b; m += SLOT_MIN) {
    const t = new Date(day.getTime() + m * 60_000);
    if (t.getTime() > now && !taken.has(t.getTime())) free.push(fmtLocal(t));
  }
  return { date: dateStr.slice(0, 10), free };
}

export async function book(clinicId: ObjectId, input: { start: string; patient_name: string; phone: string; reason?: string; conversationId?: string }) {
  const start = parseLocal(input.start);
  if (!start) return { ok: false, reason: "bad_time", message: "Send start as YYYY-MM-DDTHH:MM." };
  const slots = await freeSlots(clinicId, input.start.slice(0, 10));
  const wanted = fmtLocal(start);
  if (!slots.free?.includes(wanted)) {
    return { ok: false, reason: "taken", message: `${wanted} is not available.`, alternatives: (slots.free ?? []).slice(0, 4) };
  }
  const { bookings } = await cols();
  const bookingId = `bk_${randomBytes(3).toString("hex")}`;
  try {
    await bookings.insertOne({
      clinicId, bookingId, start, end: new Date(start.getTime() + SLOT_MIN * 60_000), patientName: input.patient_name.slice(0, 80),
      phone: input.phone.slice(0, 30), reason: (input.reason || "").slice(0, 200), status: "confirmed", conversationId: input.conversationId, createdAt: new Date(),
    });
  } catch {
    // Unique index lost a race with another caller for the same slot.
    return { ok: false, reason: "taken", message: `${wanted} was just taken.`, alternatives: [] };
  }
  return { ok: true, booking_id: bookingId, start: wanted };
}
