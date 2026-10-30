"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/client";

const LIMIT = 1200;

// Use-case starters from the brief. The clinic receptionist is the showcase; the others prove the loop is general.
const STARTERS: { label: string; text: string }[] = [
  { label: "Appointments", text: "A friendly receptionist for Sharma Dental Clinic in Indirapuram, open Mon–Sat 10 am–2 pm and 5–8:30 pm. Speaks English and Hindi, books 30-minute appointments, answers price questions from our list (scaling ₹1,200, filling ₹1,500, root canal from ₹6,000, braces consultation ₹500), and passes calls to me if a patient is in pain or upset. Never gives medical advice." },
  { label: "Lead generation", text: "A receptionist for Green Acres Realty in Noida that answers enquiries about 2 and 3 BHK flats, asks budget, preferred area and move-in date, and books a site visit. Speaks English and Hindi. Never promises a price discount." },
  { label: "Support", text: "A support line for Chai Point Café, Koramangala. Answers questions about opening hours (8 am–11 pm daily), menu and table bookings, and takes a callback for complaints. English and Hindi." },
  { label: "Negotiation", text: "An assistant for a used-car dealer that answers questions about listed cars, shares the listed price only, and books a test drive. It never agrees to a lower price; it takes the offer and says the manager will call back." },
  { label: "Collections", text: "A polite payment-reminder assistant for Sunrise Coaching Centre that reminds parents of pending fees, explains how to pay, and logs a callback if they need more time. Never threatens or shares details with anyone but the parent." },
];

export default function Builder() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState<"" | "describe" | "interview">("");
  const [error, setError] = useState("");

  async function start(mode: "describe" | "interview") {
    setBusy(mode);
    setError("");
    try {
      const r = await api<{ id: string }>("/api/clinics", { json: mode === "describe" ? { description: text } : {} });
      router.push(`/c/${r.id}${mode === "interview" ? "?step=interview" : "?step=jobcard"}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy("");
    }
  }

  return (
    <div className="card p-5 sm:p-6 shadow-[0_24px_60px_-30px_rgba(27,36,48,.25)]">
      <label htmlFor="describe" className="text-[15px] font-semibold">Describe the receptionist you want</label>
      <p className="text-[14px] text-ink-2 mt-1">Plain words, Hindi or English. Munshi turns it into a job card you can check.</p>
      <div className="relative mt-3">
        <textarea
          id="describe"
          className="field min-h-[132px] resize-y pr-3 pb-7 leading-relaxed"
          maxLength={LIMIT}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Create a friendly receptionist who speaks English and Hindi, books appointments, answers questions about teeth cleaning prices, and transfers to me if a patient has pain."
        />
        <span className="absolute right-3 bottom-2 text-[12px] text-ink-3 tabular-nums">{text.length}/{LIMIT}</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2" role="list" aria-label="Use-case starters">
        {STARTERS.map((s) => (
          <button key={s.label} role="listitem" type="button" className="chip border border-line bg-surface text-ink-2 hover:border-teal hover:text-teal" onClick={() => setText(s.text)}>
            {s.label}
          </button>
        ))}
      </div>
      {error && <p className="mt-3 text-[14px] text-fail" role="alert">{error}</p>}
      <div className="mt-5 flex flex-col sm:flex-row gap-3">
        <button className="btn btn-primary btn-lg flex-1" disabled={text.trim().length < 20 || !!busy} onClick={() => start("describe")}>
          {busy === "describe" ? "Writing the job card…" : "Create job card"}
        </button>
        <button className="btn btn-lg flex-1" disabled={!!busy} onClick={() => start("interview")}>
          <MicIcon /> {busy === "interview" ? "Opening…" : "Explain it out loud instead"}
        </button>
      </div>
    </div>
  );
}

export function MicIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </svg>
  );
}
