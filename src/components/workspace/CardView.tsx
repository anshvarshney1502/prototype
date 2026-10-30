"use client";
import { INTERVIEW_FIELDS, filledCount, type JobCard } from "@/lib/jobcard";
import { useLang, useT, type Key } from "@/lib/i18n";

export const FIELD_LABEL: Record<string, Key> = {
  business: "fBusiness", mainJobs: "fMainJobs", approvedPrices: "fPrices", booking: "fBooking",
  languages: "fLanguages", handoff: "fHandoff", never: "fNever", ifUnsure: "fIfUnsure",
};

export function useFieldText() {
  const { lang } = useLang();
  return (card: JobCard, key: string) => {
    if (key === "approvedPrices") return card.approvedPrices.map((p) => `${p.item} ${p.price}`).join(", ");
    if (key === "languages") return card.languages.map((l) => (l === "hi" ? (lang === "hi" ? "हिंदी" : "Hindi") : (lang === "hi" ? "इंग्लिश" : "English"))).join(lang === "hi" ? " और " : " and ");
    const v = card[key as keyof JobCard];
    return typeof v === "string" ? v : "";
  };
}

// The rule card: the eight things the receptionist follows, in the owner's words.
export default function CardView({ card, highlight, interview }: { card: JobCard; highlight?: string | null; interview?: boolean }) {
  const t = useT();
  const text = useFieldText();
  const n = filledCount(card);
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center px-5 pt-4 pb-3">
        <h3 className="font-semibold text-[17px]">{t("card")}</h3>
        <span className="ml-auto badge-muted tabular-nums">{t("answered", { n })}</span>
      </div>
      <dl className="divide-y divide-line">
        {INTERVIEW_FIELDS.map((f) => {
          // While interviewing, the language default must not look like an answer.
          const v = interview && f.key === "languages" && !card.answered?.includes("languages") ? "" : text(card, f.key);
          const lit = highlight === f.key;
          const gap = f.key === "ifUnsure" && !v && n >= 7;
          return (
            <div key={f.key} className={`grid grid-cols-[130px_1fr] gap-3 px-5 py-3 transition-colors duration-500 ${lit ? "bg-teal-soft" : gap ? "bg-wait-soft" : ""}`}>
              <dt className="text-[14px] text-ink-2">{t(FIELD_LABEL[f.key])}</dt>
              <dd className={`text-[15px] ${v ? "" : gap ? "text-wait font-medium" : "text-ink-3 italic"}`}>{v || (gap ? t("gapText") : t("waiting"))}</dd>
            </div>
          );
        })}
      </dl>
      {card.extraRules.length > 0 && (
        <div className="px-5 py-3 border-t border-line bg-sunk/40">
          <p className="text-[14px] text-ink-2">{t("rulesAdded")}</p>
          <ul className="mt-1 list-disc pl-5 text-[15px] space-y-0.5">{card.extraRules.map((r) => <li key={r}>{r}</li>)}</ul>
        </div>
      )}
    </div>
  );
}
