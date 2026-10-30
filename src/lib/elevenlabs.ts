import "server-only";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import type { ElevenLabs } from "@elevenlabs/elevenlabs-js";
import { env } from "./env";
import { compile } from "./compile";
import type { JobCard } from "./jobcard";
import { INTERVIEW_FIELDS } from "./jobcard";
import { cols } from "./db";

const g = globalThis as unknown as { _el?: ElevenLabsClient };
export function el() {
  if (!g._el) g._el = new ElevenLabsClient({ apiKey: env.elevenLabsKey });
  return g._el;
}

// ---------- Server tools: the receptionist books through Munshi, never on its own ----------
const str = (description: string) => ({ type: "string" as const, description });

export async function createClinicTools(clinicId: string) {
  const base = `${env.baseUrl}/api/tools/${clinicId}`;
  const headers = { "x-munshi-secret": env.toolSecret };
  const mk = (name: string, description: string, path: string, properties: Record<string, unknown>, required: string[]) =>
    el().conversationalAi.tools.create({
      toolConfig: {
        type: "webhook",
        name,
        description,
        responseTimeoutSecs: 12,
        apiSchema: {
          url: `${base}/${path}`,
          method: "POST",
          requestHeaders: headers,
          requestBodySchema: { type: "object", properties: properties as never, required },
        },
      },
    });
  const [checkSlots, bookSlot, logCallback] = await Promise.all([
    mk("check_slots", "List free appointment times on a date. Call before offering times.", "check-slots",
      { date: str("Date in YYYY-MM-DD format, India time") }, ["date"]),
    mk("book_slot", "Book an appointment. Only confirm a booking to the caller if this returns ok=true with a booking_id.", "book-slot",
      { start: str("Start time, ISO 8601 local India time, e.g. 2026-11-05T17:30"), patient_name: str("Caller's name"),
        phone: str("Caller's phone number"), reason: str("Reason for the visit") }, ["start", "patient_name", "phone"]),
    mk("log_callback", "Ask the clinic to call the caller back. Use when the caller needs a person or something can't be done now.", "log-callback",
      { name: str("Caller's name"), phone: str("Caller's phone number"), reason: str("Why they need a callback"),
        urgent: { type: "boolean", description: "true if the caller is in pain, bleeding, swelling or very upset" } },
      ["name", "phone", "reason", "urgent"]),
  ]);
  return { checkSlots: checkSlots.id, bookSlot: bookSlot.id, logCallback: logCallback.id };
}

// ---------- Receptionist agent and its versions ----------
function conversationConfig(card: JobCard, toolIds: string[]): ElevenLabs.ConversationalConfig {
  const { prompt, firstMessage } = compile(card);
  // Hindi needs the multilingual Flash v2.5 and a Hindi-primary agent (Hinglish mode still speaks English);
  // ElevenLabs requires English-only agents to use Flash v2.
  const hindi = card.languages.includes("hi");
  const modelId = hindi ? "eleven_flash_v2_5" : "eleven_flash_v2";
  return {
    agent: {
      firstMessage,
      language: hindi ? "hi" : "en",
      ...(hindi ? { hinglishMode: true } : {}),
      prompt: { prompt, llm: env.agentLlm as ElevenLabs.Llm, toolIds, timezone: "Asia/Kolkata", temperature: 0.4 },
    },
    tts: card.voiceId ? { modelId, voiceId: card.voiceId } : { modelId },
    turn: { turnTimeout: 7 },
  };
}

export async function createReceptionist(card: JobCard, toolIds: string[]) {
  const { agentId } = await el().conversationalAi.agents.create({
    name: `Munshi · ${card.clinicName}`,
    tags: ["munshi"],
    conversationConfig: conversationConfig(card, toolIds),
  });
  const a = await el().conversationalAi.agents.get(agentId);
  return { agentId, mainBranchId: a.mainBranchId || a.branchId || "", versionId: a.versionId || "" };
}

// Coach / refine: a new version lives on its own branch, so the live version is never touched.
export async function createVersionBranch(agentId: string, parentVersionId: string, n: number, reason: string, card: JobCard, toolIds: string[]) {
  const b = await el().conversationalAi.agents.branches.create(agentId, {
    parentVersionId,
    name: `version-${n}`,
    description: reason.slice(0, 280),
  });
  const updated = await el().conversationalAi.agents.update(agentId, {
    branchId: b.createdBranchId,
    conversationConfig: conversationConfig(card, toolIds),
    versionDescription: reason.slice(0, 280),
  });
  return { branchId: b.createdBranchId, versionId: updated.versionId || b.createdVersionId };
}

export async function mergeToMain(agentId: string, branchId: string, mainBranchId: string) {
  if (branchId === mainBranchId) return;
  await el().conversationalAi.agents.branches.merge(agentId, branchId, { targetBranchId: mainBranchId, archiveSourceBranch: false });
}

// ---------- Agent Testing ----------
export async function createElTest(body: ElevenLabs.conversationalAi.TestsCreateRequestBody) {
  const r = await el().conversationalAi.tests.create(body);
  return r.id;
}

export async function runElTests(agentId: string, elTestIds: string[], branchId?: string) {
  return el().conversationalAi.agents.runTests(agentId, {
    tests: elTestIds.map((testId) => ({ testId })),
    branchId,
    repeatCount: 3, // one good answer is not proof
  });
}

export async function getInvocation(id: string) {
  return el().conversationalAi.tests.invocations.get(id);
}

// Best-effort removal of everything a failed approve created on ElevenLabs.
export async function cleanup({ testIds, agentId, toolIds }: { testIds: string[]; agentId?: string; toolIds: string[] }) {
  const c = el().conversationalAi;
  for (const t of testIds) await c.tests.delete(t).catch(() => {});
  if (agentId) await c.agents.delete(agentId).catch(() => {});
  for (const t of toolIds) await c.tools.delete(t, { force: true }).catch(() => {});
}

// ---------- Live sessions ----------
export async function signedUrl(agentId: string, branchId?: string) {
  const r = await el().conversationalAi.conversations.getSignedUrl({ agentId, branchId });
  return r.signedUrl;
}

// ---------- Voices ----------
export async function searchVoices(search = "") {
  const r = await el().voices.search({ search: search || undefined, pageSize: 30, category: undefined, voiceType: undefined, sort: undefined } as never);
  return r.voices.map((v) => ({
    id: v.voiceId,
    name: v.name || "Voice",
    preview: v.previewUrl || "",
    labels: (v.labels || {}) as Record<string, string>,
    description: v.description || "",
  }));
}

export async function sharedIndianVoices() {
  // Library voices filtered for calm conversational speech with an Indian accent.
  const r = await el().voices.getShared({ pageSize: 24, language: "en", accent: "indian", useCases: ["conversational"] } as never);
  return r.voices.map((v) => ({
    id: v.voiceId,
    owner: v.publicOwnerId,
    name: v.name,
    preview: v.previewUrl || "",
    labels: { accent: v.accent || "", gender: v.gender || "", age: v.age || "", useCase: v.useCase || "" },
    description: v.description || "",
  }));
}

// A library voice must be added to the workspace before an agent can speak with it.
export async function ensureVoice(card: JobCard): Promise<JobCard> {
  if (!card.voiceId || !card.voiceOwner) return card;
  const mine = await el().voices.get(card.voiceId).then(() => true).catch(() => false);
  if (mine) return { ...card, voiceOwner: "" };
  const added = await el().voices.share(card.voiceOwner, card.voiceId, { newName: `Munshi · ${card.voiceName || "voice"}`.slice(0, 60) });
  return { ...card, voiceId: added.voiceId || card.voiceId, voiceOwner: "" };
}

// ---------- Speech to text (Scribe) for spoken coaching ----------
export async function transcribe(file: Blob) {
  const r = await el().speechToText.convert({ file, modelId: "scribe_v2" } as never);
  return ("text" in r ? (r as { text: string }).text : "").trim();
}

// ---------- Conversation history (call log fallback when no webhook is configured) ----------
export async function listConversations(agentId: string) {
  const r = await el().conversationalAi.conversations.list({ agentId, pageSize: 30 });
  return r.conversations;
}
export async function getConversation(id: string) {
  return el().conversationalAi.conversations.get(id);
}

// ---------- The interviewer: an ElevenLabs agent whose client tools write the job card ----------
export async function interviewerAgentId() {
  const { settings } = await cols();
  const s = await settings.findOne({ _id: "interviewer_v3" });
  if (s?.value) return s.value as string;

  const questions = INTERVIEW_FIELDS.map((f, i) => `${i + 1}. (${f.key}) ${f.q}`).join("\n");
  const prompt = `You are Munshi, a friendly assistant who helps a small clinic owner set up an AI receptionist by interviewing them, the way a manager briefs a new hire.

Ask these eight questions, one at a time, in order:
${questions}

After each answer:
- Call update_job_card with the field key and a clean, short version of their answer (write prices as "item ₹amount, item ₹amount").
- Briefly confirm in a few words, then ask the next question.
If an answer is vague or they say something like "just handle it", record it as given (use an empty string for ifUnsure if they gave no clear rule) and move on. Do not lecture.
Speak the language the owner uses (Hindi, English or Hinglish). Keep it quick and warm.
When all eight are done, call finish_interview and say the job card is ready to review.`;

  const { agentId } = await el().conversationalAi.agents.create({
    name: "Munshi · Interviewer",
    tags: ["munshi", "interviewer"],
    conversationConfig: {
      agent: {
        firstMessage: "Hello Doctor. I'll ask you eight quick questions, like you'd brief a new receptionist. What is your clinic called, where is it, and when are you open?",
        language: "hi",
        hinglishMode: true,
        prompt: {
          prompt,
          llm: env.agentLlm as ElevenLabs.Llm,
          temperature: 0.3,
          tools: [
            {
              type: "client",
              name: "update_job_card",
              description: "Write one answer into the owner's job card.",
              expectsResponse: true,
              parameters: {
                type: "object",
                required: ["field", "value"],
                properties: {
                  field: { type: "string", description: "One of: " + INTERVIEW_FIELDS.map((f) => f.key).join(", "), enum: INTERVIEW_FIELDS.map((f) => f.key) },
                  value: { type: "string", description: "The owner's answer, cleaned up" },
                },
              },
            },
            { type: "client", name: "finish_interview", description: "Call once all eight questions are answered.", expectsResponse: false },
          ],
        },
      },
      tts: { modelId: "eleven_flash_v2_5" },
    },
  });
  await settings.updateOne({ _id: "interviewer_v3" }, { $set: { value: agentId } }, { upsert: true });
  return agentId;
}
