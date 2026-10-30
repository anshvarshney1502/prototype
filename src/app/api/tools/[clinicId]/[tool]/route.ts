import { timingSafeEqual } from "node:crypto";
import { route, body } from "@/lib/api";
import { cols, oid, HttpError } from "@/lib/db";
import { env } from "@/lib/env";
import { freeSlots, book } from "@/lib/calendar";

// Server tools the receptionist calls mid-conversation. Guarded by a shared secret header set on the tool.
function authorised(req: Request) {
  const got = Buffer.from(req.headers.get("x-munshi-secret") || "");
  const want = Buffer.from(env.toolSecret);
  return got.length === want.length && timingSafeEqual(got, want);
}

export const POST = route<{ clinicId: string; tool: string }>(async (req, { clinicId, tool }) => {
  if (!authorised(req)) throw new HttpError(401, "Unauthorised");
  const _id = oid(clinicId);
  const b = await body<Record<string, unknown>>(req);
  const s = (k: string) => (typeof b[k] === "string" ? (b[k] as string) : "");
  const conversationId = req.headers.get("x-conversation-id") || undefined;

  if (tool === "check-slots") return freeSlots(_id, s("date"));
  if (tool === "book-slot") {
    if (!s("start") || !s("patient_name") || !s("phone")) return { ok: false, reason: "missing_details", message: "Need start, patient_name and phone." };
    return book(_id, { start: s("start"), patient_name: s("patient_name"), phone: s("phone"), reason: s("reason"), conversationId });
  }
  if (tool === "log-callback") {
    const { callbacks } = await cols();
    await callbacks.insertOne({ clinicId: _id, name: s("name").slice(0, 80), phone: s("phone").slice(0, 30), reason: s("reason").slice(0, 300),
      urgent: b.urgent === true || b.urgent === "true", conversationId, createdAt: new Date(), done: false });
    return { ok: true, message: "Callback logged. The clinic will call back." };
  }
  throw new HttpError(404, "Unknown tool");
});
