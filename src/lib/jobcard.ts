import { z } from "zod";

// The job card is the owner's contract with the receptionist. Zod guards it:
// a card that doesn't validate never reaches agent creation.
export const Price = z.object({ item: z.string().min(1).max(80), price: z.string().min(1).max(40) });

export const JobCard = z.object({
  clinicName: z.string().min(2).max(80),
  business: z.string().max(400).default(""),          // name, area, hours
  hours: z.string().max(200).default(""),
  mainJobs: z.string().max(400).default(""),
  approvedPrices: z.array(Price).max(40).default([]),
  booking: z.string().max(300).default(""),
  languages: z.array(z.enum(["en", "hi"])).min(1).default(["en", "hi"]),
  handoff: z.string().max(400).default(""),            // when to pass to a person
  never: z.string().max(400).default(""),
  ifUnsure: z.string().max(400).default(""),           // left empty on purpose in the demo: Trial Day catches it
  extraRules: z.array(z.string().max(300)).max(40).default([]), // rules added by Coach / refine
  greeting: z.string().max(240).default(""),
  voiceId: z.string().default(""),
  voiceName: z.string().default(""),
  voiceOwner: z.string().default(""),   // set while the voice is still a library voice, cleared once added to the workspace
  answered: z.array(z.string()).max(20).default([]),   // fields the owner actually answered (languages always has a default)
  useCase: z.enum(["appointments", "lead_generation", "support", "negotiation", "collections"]).default("appointments"),
});
export type JobCard = z.infer<typeof JobCard>;

// The eight things a manager asks a new receptionist; the interview fills these one by one.
export const INTERVIEW_FIELDS = [
  { key: "business", label: "Business", q: "What is your clinic called, where is it, and when are you open?" },
  { key: "mainJobs", label: "Main jobs", q: "What do patients usually call about?" },
  { key: "approvedPrices", label: "Approved prices", q: "Do you have a price list? I will only quote prices that are on it." },
  { key: "booking", label: "Booking", q: "How long is an appointment, and how should I book it?" },
  { key: "languages", label: "Languages", q: "Which languages do your patients speak?" },
  { key: "handoff", label: "Pass to a person", q: "When should a call come to you instead of me?" },
  { key: "never", label: "Never", q: "Is there anything I must never do?" },
  { key: "ifUnsure", label: "If unsure", q: "If someone asks something you haven't told me, what should I do?" },
] as const;
export type FieldKey = (typeof INTERVIEW_FIELDS)[number]["key"];

export function filledCount(card: Partial<JobCard>) {
  return INTERVIEW_FIELDS.filter(({ key }) => {
    if (key === "languages") return !!card.answered?.includes("languages");
    const v = card[key as keyof JobCard];
    return Array.isArray(v) ? v.length > 0 : typeof v === "string" && v.trim().length > 0;
  }).length;
}

export function emptyCard(clinicName = "My clinic"): JobCard {
  return JobCard.parse({ clinicName });
}

// Parses "scaling ₹1,200, filling ₹1,500, root canal from ₹6,000" into price rows.
// A comma followed by three digits is a thousands separator, not a list separator.
export function parsePrices(text: string): z.infer<typeof Price>[] {
  return text
    .split(/[;\n]+|,(?!\d{3}(?!\d))/)
    .map((s) => s.trim())
    .map((s) => s.match(/^(.*?)[\s:-]*((?:₹|rs\.?|inr)\s*[\d,]+(?:\s*(?:onwards|\+))?|[\d,]{3,}\s*(?:rupees|rs)?)$/i))
    .filter((m): m is RegExpMatchArray => !!m && m[1].trim().length > 0)
    .map((m) => {
      const from = /\bfrom\s*$/i.test(m[1]);
      const item = m[1].replace(/\b(from|for|is|costs?)\b/gi, "").replace(/\s+/g, " ").trim();
      const amount = m[2].replace(/^(rs\.?|inr)\s*/i, "₹").trim();
      return { item, price: from ? `from ${amount}` : amount };
    })
    .filter((p) => p.item.length > 0);
}
