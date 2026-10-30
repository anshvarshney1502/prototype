"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Orb from "@/components/OrbLazy";
import { MicIcon } from "@/components/Builder";
import { VoiceProvider, useVoiceSession } from "@/components/voice";
import { api, type Workspace } from "@/lib/client";
import { INTERVIEW_FIELDS, filledCount, type JobCard } from "@/lib/jobcard";
import CardView from "./CardView";

type Chip = { at: number; text: string; warn?: boolean };

export default function Interview(props: { id: string; data: Workspace; onCard: (c: JobCard) => void; onDone: () => void }) {
  return <VoiceProvider><Inner {...props} /></VoiceProvider>;
}

function Inner({ id, data, onCard, onDone }: { id: string; data: Workspace; onCard: (c: JobCard) => void; onDone: () => void }) {
  const [chips, setChips] = useState<Chip[]>([]);
  const [lit, setLit] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const [busy, setBusy] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const card = data.clinic.card;

  // Client tools: the interviewer agent writes into the job card through these.
  const clientTools = useMemo(() => ({
    update_job_card: async (p: Record<string, unknown>) => {
      const field = String(p.field || "");
      const value = String(p.value ?? "");
      const label = INTERVIEW_FIELDS.find((f) => f.key === field)?.label ?? field;
      try {
        const r = await api<{ card: JobCard }>(`/api/clinics/${id}/interview-field`, { json: { field, value } });
        onCard(r.card);
        setLit(field);
        const gap = field === "ifUnsure" && !r.card.ifUnsure.trim();
        setChips((c) => [...c, gap ? { at: Date.now(), text: `No clear rule given for: ${label}`, warn: true } : { at: Date.now(), text: `Added to job card: ${label}` }]);
        return `Saved ${label}.`;
      } catch (e) {
        return `Could not save: ${e instanceof Error ? e.message : "error"}`;
      }
    },
    finish_interview: async () => { setFinished(true); return "ok"; },
  }), [id, onCard]);

  const s = useVoiceSession(clientTools);
  const live = s.status === "connected" || s.status === "connecting";

  const feed = useMemo(
    () => [...s.lines.filter((l) => l.role !== "tool").map((l) => ({ ...l, kind: "line" as const })), ...chips.map((c) => ({ ...c, kind: "chip" as const }))].sort((a, b) => a.at - b.at),
    [s.lines, chips],
  );
  useEffect(() => { scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" }); }, [feed.length]);
  useEffect(() => { if (finished && s.status === "connected") { const t = setTimeout(() => s.endSession(), 4500); return () => clearTimeout(t); } }, [finished, s]);

  async function start() {
    setBusy(true);
    try {
      const { signedUrl } = await api<{ signedUrl: string }>(`/api/clinics/${id}/interview`, { method: "POST" });
      await s.start(signedUrl);
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    } finally { setBusy(false); }
  }

  const n = filledCount(card);
  return (
    <div className="grid lg:grid-cols-[1.1fr_.9fr] gap-6">
      <section>
        <h1 className="text-[28px] font-semibold">Tell Munshi what your receptionist should do</h1>
        <p className="text-ink-2 mt-1">Speak naturally in Hindi, English or Hinglish. Munshi asks eight questions, the same ones a manager would ask a new receptionist.</p>
        <div className="card mt-5 overflow-hidden">
          <div ref={scroller} className="h-[420px] overflow-y-auto p-5 space-y-3" aria-live="polite">
            {feed.length === 0 && (
              <div className="h-full grid place-items-center text-center">
                <div>
                  <div className="w-40 h-40 mx-auto"><Orb className="w-full h-full" getLevel={s.getLevel} /></div>
                  <p className="text-ink-2 mt-2 max-w-[340px]">Press <b>Start voice interview</b>. It takes about five minutes. Each answer becomes a line on your job card.</p>
                </div>
              </div>
            )}
            {feed.map((f, i) =>
              f.kind === "chip" ? (
                <div key={i} className="flex justify-center rise"><span className={f.warn ? "badge-wait" : "badge-pass"}>{f.warn ? "!" : "✓"} {f.text}</span></div>
              ) : (
                <div key={i} className={`flex rise ${f.role === "user" ? "justify-end" : ""}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-[15px] ${f.role === "user" ? "bg-teal-soft" : "bg-sunk"}`}>
                    <p className="text-[11.5px] text-ink-3 mb-0.5">{f.role === "user" ? "You" : "Munshi"}</p>
                    {f.text}
                  </div>
                </div>
              ),
            )}
          </div>
          <div className="border-t border-line p-3 flex items-center gap-3 bg-surface">
            {live && <div className="w-10 h-10 shrink-0"><Orb className="w-full h-full" getLevel={s.getLevel} /></div>}
            <p className="text-[14px] text-ink-2 flex-1">
              {s.error ? <span className="text-fail">{s.error}</span> : live ? (s.isSpeaking ? "Munshi is speaking… you can interrupt" : "Listening…") : finished || n === 8 ? `Interview finished. ${n} of 8 questions answered.` : "Microphone off"}
            </p>
            {live ? (
              <button className="btn" onClick={() => s.endSession()}>End interview</button>
            ) : (
              <>
                <button className="btn btn-ghost" onClick={onDone}>Type instead</button>
                <button className="btn btn-primary" disabled={busy} onClick={start}><MicIcon /> {n > 0 ? "Continue interview" : "Start voice interview"}</button>
              </>
            )}
          </div>
        </div>
      </section>
      <aside className="lg:pt-[76px]">
        <CardView card={card} highlight={lit} interview />
        <div className="mt-4 flex justify-end">
          <button className="btn btn-primary" disabled={n < 3 || live} onClick={onDone}>Review job card</button>
        </div>
      </aside>
    </div>
  );
}
