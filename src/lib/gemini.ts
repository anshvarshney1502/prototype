import "server-only";
import { GoogleGenAI, Type } from "@google/genai";
import { env } from "./env";
import { JobCard, parsePrices } from "./jobcard";

const g = globalThis as unknown as { _ai?: GoogleGenAI };
const ai = () => (g._ai ??= new GoogleGenAI({ apiKey: env.geminiKey }));

async function json<T>(system: string, user: string, schema: object): Promise<T> {
  // Gemini returns 503/429 under load: retry with backoff, then fall back to the "latest" flash alias.
  const models = [env.geminiModel, env.geminiModel, "gemini-flash-latest", "gemini-flash-latest"];
  let r: Awaited<ReturnType<ReturnType<typeof ai>["models"]["generateContent"]>> | undefined;
  for (let i = 0; i < models.length; i++) {
    try {
      r = await ai().models.generateContent({
        model: models[i],
        contents: user,
        config: { systemInstruction: system, responseMimeType: "application/json", responseSchema: schema, temperature: 0.2 },
      });
      break;
    } catch (e) {
      const msg = String((e as Error)?.message || e);
      if (i === models.length - 1 || !/503|429|UNAVAILABLE|RESOURCE_EXHAUSTED|high demand|overloaded/i.test(msg)) throw e;
      await new Promise((res) => setTimeout(res, 800 * (i + 1)));
    }
  }
  if (!r) throw new Error("The language model is busy. Try again in a moment.");
  const text = r.text ?? "";
  try { return JSON.parse(text) as T; } catch { throw new Error("The language model returned an unreadable answer. Try again."); }
}

const S = Type.STRING;

// Write stage: a plain-language description becomes a draft job card.
export async function describeToCard(description: string): Promise<JobCard> {
  const out = await json<Record<string, unknown>>(
    `You turn a small-business owner's description of the receptionist they want into a job card.
Only use facts the owner gave. Leave a field as an empty string when the owner did not say it. Never invent prices.
approvedPrices: one entry per item with a price the owner stated, price formatted like "₹1,200".
languages: codes from ["en","hi"]. useCase: one of appointments, lead_generation, support, negotiation, collections.`,
    description,
    {
      type: Type.OBJECT,
      properties: {
        clinicName: { type: S }, business: { type: S }, hours: { type: S }, mainJobs: { type: S },
        approvedPrices: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { item: { type: S }, price: { type: S } }, required: ["item", "price"] } },
        booking: { type: S }, languages: { type: Type.ARRAY, items: { type: S } }, handoff: { type: S }, never: { type: S },
        ifUnsure: { type: S }, greeting: { type: S }, useCase: { type: S },
      },
      required: ["clinicName"],
    },
  );
  const langs = Array.isArray(out.languages) ? (out.languages as string[]).filter((l) => l === "en" || l === "hi") : [];
  return JobCard.parse({
    ...out,
    clinicName: String(out.clinicName || "My clinic").slice(0, 80),
    languages: langs.length ? langs : ["en", "hi"],
    useCase: ["appointments", "lead_generation", "support", "negotiation", "collections"].includes(String(out.useCase)) ? out.useCase : "appointments",
  });
}

// Coach: one spoken sentence becomes a rule on the card and a permanent test.
export async function coachToRule(card: JobCard, failed: { name: string; must: string; userLine: string; badReply: string }, correction: string) {
  return json<{ field: "ifUnsure" | "never" | "handoff" | "booking" | "extraRule"; newText: string; ruleSummary: string; testCondition: string }>(
    `You help a clinic owner fix their AI receptionist. They describe in plain words what the receptionist should have done.
Turn it into ONE clear rule for the job card. Pick the field it belongs to:
- ifUnsure: what to do when the receptionist doesn't know something (unknown prices etc.)
- never: things it must never do
- handoff: when to pass to a person
- booking: how to book
- extraRule: anything else
newText: the full new text for that field (merge with the current text if the field already has content; for extraRule just the rule).
ruleSummary: under 20 words, shown to the owner.
testCondition: a success condition an evaluator can check on the receptionist's next reply to the same caller line.`,
    JSON.stringify({ currentCard: card, failedTest: failed, ownerCorrection: correction }),
    {
      type: Type.OBJECT,
      properties: { field: { type: S, enum: ["ifUnsure", "never", "handoff", "booking", "extraRule"] }, newText: { type: S }, ruleSummary: { type: S }, testCondition: { type: S } },
      required: ["field", "newText", "ruleSummary", "testCondition"],
    },
  );
}

// Refine: chat instructions like "make the greeting shorter and warmer" or "add Hindi".
export async function refineCard(card: JobCard, instruction: string) {
  const out = await json<{ patch: Record<string, unknown>; summary: string }>(
    `You edit an AI receptionist's job card from the owner's plain-language instruction.
Return only the fields that change in "patch" (same keys and types as the card). Never invent prices. summary: what changed, under 15 words.
Fields: clinicName, business, hours, mainJobs, approvedPrices[{item,price}], booking, languages ["en","hi"], handoff, never, ifUnsure, extraRules[string], greeting.`,
    JSON.stringify({ card, instruction }),
    { type: Type.OBJECT, properties: { patch: { type: Type.OBJECT, properties: {
        clinicName: { type: S }, business: { type: S }, hours: { type: S }, mainJobs: { type: S }, booking: { type: S }, handoff: { type: S },
        never: { type: S }, ifUnsure: { type: S }, greeting: { type: S },
        languages: { type: Type.ARRAY, items: { type: S } }, extraRules: { type: Type.ARRAY, items: { type: S } },
        approvedPrices: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { item: { type: S }, price: { type: S } } } },
      } }, summary: { type: S } }, required: ["patch", "summary"] },
  );
  const next = JobCard.safeParse({ ...card, ...out.patch });
  if (!next.success) throw new Error("That change would make the job card invalid. Try saying it differently.");
  return { card: next.data, summary: out.summary };
}

// Observe: summary, sentiment and outcome for each call.
export async function summarizeCall(transcript: { role: string; message: string }[], toolsUsed: string[]) {
  return json<{ summary: string; sentiment: "positive" | "neutral" | "negative"; outcome: "booked" | "callback" | "needs_you" | "answered" | "unresolved"; flag: string }>(
    `Summarise a clinic receptionist call for the owner in one sentence (what the caller wanted and what happened).
outcome: booked (a booking tool succeeded), callback (callback logged, not urgent), needs_you (urgent or the owner must act), answered (question answered), unresolved.
flag: empty string, or a short reason if the owner should look at it (pain, complaint, the agent made a promise it shouldn't).`,
    JSON.stringify({ transcript, toolsUsed }),
    { type: Type.OBJECT, properties: { summary: { type: S }, sentiment: { type: S, enum: ["positive", "neutral", "negative"] },
      outcome: { type: S, enum: ["booked", "callback", "needs_you", "answered", "unresolved"] }, flag: { type: S } }, required: ["summary", "sentiment", "outcome", "flag"] },
  );
}

// Interview answers arrive as free text; prices need structure.
export function normalizeInterviewValue(field: string, value: string) {
  if (field === "approvedPrices") return parsePrices(value);
  if (field === "languages") {
    const v = value.toLowerCase();
    const l = [v.includes("english") || v.includes("angrezi") ? "en" : null, v.includes("hindi") || v.includes("हिंदी") ? "hi" : null].filter(Boolean);
    return l.length ? l : ["en", "hi"];
  }
  return value.trim();
}
