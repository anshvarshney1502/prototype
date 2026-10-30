// Server-only configuration. Every secret stays on the server; the browser only ever sees signed URLs.
import "server-only";

function need(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable ${name}. Copy .env.example to .env.local and fill it in.`);
  return v;
}

export const env = {
  get elevenLabsKey() { return need("ELEVENLABS_API_KEY"); },
  get geminiKey() { return need("GEMINI_API_KEY"); },
  get mongoUri() { return need("MONGODB_URI"); },
  get mongoDb() { return process.env.MONGODB_DB || "munshi"; },
  // Shared secret ElevenLabs sends to our tool endpoints, so nobody else can book slots.
  get toolSecret() { return need("TOOL_SECRET"); },
  // Public URL ElevenLabs uses to reach our tool endpoints (Render URL in production).
  get baseUrl() { return need("PUBLIC_BASE_URL").replace(/\/$/, ""); },
  get webhookSecret() { return process.env.ELEVENLABS_WEBHOOK_SECRET || ""; },
  geminiModel: process.env.GEMINI_MODEL || "gemini-3.5-flash",
  agentLlm: process.env.AGENT_LLM || "gemini-3.5-flash",
};
