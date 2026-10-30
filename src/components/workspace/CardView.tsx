"use client";
import { INTERVIEW_FIELDS, filledCount, type JobCard } from "@/lib/jobcard";

export function fieldText(card: JobCard, key: string) {
  const v = card[key as keyof JobCard];
  if (key === "approvedPrices") return card.approvedPrices.map((p) => `${p.item} ${p.price}`).join(", ");
  if (key === "languages") return card.languages.map((l) => (l === "hi" ? "Hindi" : "English")).join(" and ");
  return typeof v === "string" ? v : "";
}

// Read-only job card: the eight lines the receptionist follows.
export default function CardView({ card, highlight, compact }: { card: JobCard; highlight?: string | null; compact?: boolean }) {
  const n = filledCount(card);
  return (
    <div className="card">
      <div className="flex items-center px-5 pt-4 pb-3">
        <h3 className="font-semibold text-[16px]">Job card</h3>
        <span className="ml-auto badge-muted tabular-nums">{n} of 8 answered</span>
      </div>
      <dl className="divide-y divide-line">
        {INTERVIEW_FIELDS.map((f) => {
          const t = fieldText(card, f.key);
          const lit = highlight === f.key;
          const gap = f.key === "ifUnsure" && !t && n >= 7;
          return (
            <div key={f.key} className={`grid grid-cols-[120px_1fr] gap-3 px-5 ${compact ? "py-2" : "py-3"} transition-colors ${lit ? "bg-teal-soft" : gap ? "bg-wait-soft" : ""}`}>
              <dt className="text-[13.5px] text-ink-2">{f.label}</dt>
              <dd className={`text-[14.5px] ${t ? "" : gap ? "text-wait font-medium" : "text-ink-3 italic"}`}>
                {t || (gap ? "Not mentioned. The receptionist will answer as best it can." : "Waiting for your answer")}
              </dd>
            </div>
          );
        })}
      </dl>
      {card.extraRules.length > 0 && (
        <div className="px-5 py-3 border-t border-line">
          <p className="text-[13.5px] text-ink-2">Rules you added</p>
          <ul className="mt-1 list-disc pl-5 text-[14px] space-y-0.5">{card.extraRules.map((r) => <li key={r}>{r}</li>)}</ul>
        </div>
      )}
    </div>
  );
}
