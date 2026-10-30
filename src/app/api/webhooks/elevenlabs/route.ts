import { NextResponse } from "next/server";
import { cols } from "@/lib/db";
import { env } from "@/lib/env";
import { el } from "@/lib/elevenlabs";
import { ingestConversation } from "@/lib/workflow";

// Post-call webhook (HMAC-verified). Configure it in ElevenLabs → Agents → Settings → Post-call webhook.
export async function POST(req: Request) {
  const raw = await req.text();
  if (!env.webhookSecret) return NextResponse.json({ error: "Webhook secret not configured" }, { status: 503 });
  let event: { type?: string; data?: { agent_id?: string; conversation_id?: string } };
  try {
    event = await el().webhooks.constructEvent(raw, req.headers.get("elevenlabs-signature") || "", env.webhookSecret);
  } catch {
    return NextResponse.json({ error: "Bad signature" }, { status: 401 });
  }
  if (event.type === "post_call_transcription" && event.data?.agent_id && event.data.conversation_id) {
    const { clinics } = await cols();
    const c = await clinics.findOne({ agentId: event.data.agent_id });
    if (c) await ingestConversation(c, event.data.conversation_id).catch((e) => console.error("[webhook]", e));
  }
  return NextResponse.json({ ok: true });
}
