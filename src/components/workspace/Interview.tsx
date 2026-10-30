"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Orb from "@/components/OrbLazy";
import * as I from "@/components/Icons";
import { VoiceProvider, useVoiceSession } from "@/components/voice";
import { api, type Workspace } from "@/lib/client";
import { filledCount, type JobCard } from "@/lib/jobcard";
import { useT } from "@/lib/i18n";
import CardView, { FIELD_LABEL } from "./CardView";

type Chip = { at: number; key: string; warn?: boolean };

export default function Interview(props: { id: string; data: Workspace; onCard: (c: JobCard) => void; onDone: () => void }) {
  return <VoiceProvider><Inner {...props} /></VoiceProvider>;
}

function Inner({ id, data, onCard, onDone }: { id: string; data: Workspace; onCard: (c: JobCard) => void; onDone: () => void }) {
  const t = useT();
  const [chips, setChips] = useState<Chip[]>([]);
  const [lit, setLit] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const [busy, setBusy] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const card = data.clinic.card;

  // The interviewer writes each answer onto the card through these browser-side tools.
  const clientTools = useMemo(() => ({
    update_job_card: async (p: Record<string, unknown>) => {
      const field = String(p.field || "");
      try {
        const r = await api<{ card: JobCard }>(`/api/clinics/${id}/interview-field`, { json: { field, value: String(p.value ?? "") } });
        onCard(r.card);
        setLit(field);
        setChips((c) => [...c, { at: Date.now(), key: field, warn: field === "ifUnsure" && !r.card.ifUnsure.trim() }]);
        return "Saved.";
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
  useEffect(() => { if (finished && s.status === "connected") { const x = setTimeout(() => s.endSession(), 4500); return () => clearTimeout(x); } }, [finished, s]);

  async function start() {
    setBusy(true);
    try {
      const { signedUrl } = await api<{ signedUrl: string }>(`/api/clinics/${id}/interview`, { method: "POST" });
      await s.start(signedUrl);
    } catch (e) { alert(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  }

  const n = filledCount(card);
  return (
    <div className="grid lg:grid-cols-[1.1fr_.9fr] gap-6">
      <section>
        <h1 className="font-display text-[30px] sm:text-[36px] leading-tight">{t("ivTitle")}</h1>
        <p className="text-ink-2 mt-2 text-[16px]">{t("ivSub")}</p>
        <div className="card mt-6 overflow-hidden">
          <div ref={scroller} className="h-[440px] overflow-y-auto p-5 space-y-3" aria-live="polite">
            {feed.length === 0 && (
              <div className="h-full grid place-items-center text-center">
                <div>
                  <div className="w-44 h-44 mx-auto"><Orb className="w-full h-full" getLevel={s.getLevel} /></div>
                  <p className="text-ink-2 mt-3 max-w-[340px] mx-auto">{t("ivEmpty")}</p>
                </div>
              </div>
            )}
            {feed.map((f, i) =>
              f.kind === "chip" ? (
                <div key={i} className="flex justify-center bubble-in">
                  <span className={f.warn ? "badge-wait" : "badge-pass"}>{f.warn ? "!" : "✓"} {t(f.warn ? "ivGap" : "ivAdded", { f: t(FIELD_LABEL[f.key] ?? "fBusiness") })}</span>
                </div>
              ) : (
                <div key={i} className={`flex bubble-in ${f.role === "user" ? "justify-end" : ""}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-[15px] ${f.role === "user" ? "bg-ink text-white rounded-br-md" : "bg-sunk rounded-bl-md"}`}>
                    <p className={`text-[11.5px] mb-0.5 ${f.role === "user" ? "text-white/60" : "text-ink-3"}`}>{f.role === "user" ? t("you") : "Munshi"}</p>
                    {f.text}
                  </div>
                </div>
              ),
            )}
          </div>
          <div className="border-t border-line p-3 flex flex-wrap items-center gap-3 bg-surface">
            {live && <div className="w-11 h-11 shrink-0"><Orb className="w-full h-full" getLevel={s.getLevel} /></div>}
            <p className="text-[14.5px] text-ink-2 flex-1 min-w-[160px]">
              {s.error ? <span className="text-fail">{t("micBlocked")}</span> : live ? (s.isSpeaking ? t("ivSpeaking") : t("ivListening")) : finished || n === 8 ? t("ivDone", { n }) : t("ivMicOff")}
            </p>
            {live ? (
              <button className="btn" onClick={() => s.endSession()}>{t("ivEnd")}</button>
            ) : (
              <>
                <button className="btn btn-ghost" onClick={onDone}><I.Keyboard className="w-4 h-4" /> {t("ivTypeInstead")}</button>
                <button className="btn btn-primary" disabled={busy} onClick={start}><I.Mic className="w-4 h-4" /> {n > 0 ? t("ivContinue") : t("ivStart")}</button>
              </>
            )}
          </div>
        </div>
      </section>
      <aside className="lg:pt-[92px]">
        <CardView card={card} highlight={lit} interview />
        <div className="mt-4 flex justify-end">
          <button className="btn btn-primary btn-lg" disabled={n < 3 || live} onClick={onDone}>{t("ivReview")} <I.Arrow className="w-4 h-4" /></button>
        </div>
      </aside>
    </div>
  );
}
