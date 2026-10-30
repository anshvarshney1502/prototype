"use client";
import { useEffect, useRef, useState } from "react";
import Orb from "@/components/OrbLazy";
import * as I from "@/components/Icons";
import { VoiceProvider, useVoiceSession } from "@/components/voice";
import { api, type VersionJ } from "@/lib/client";
import { useT } from "@/lib/i18n";

// Talk to the exact version in the browser: what was said, how fast it replied, what it did.
export default function LiveCall(props: { id: string; version: VersionJ }) {
  return <VoiceProvider><Inner {...props} /></VoiceProvider>;
}

function Inner({ id, version }: { id: string; version: VersionJ }) {
  const t = useT();
  const s = useVoiceSession();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const box = useRef<HTMLDivElement>(null);
  const live = s.status === "connected" || s.status === "connecting";
  useEffect(() => { box.current?.scrollTo({ top: box.current.scrollHeight, behavior: "smooth" }); }, [s.lines.length]);

  async function start() {
    setBusy(true); setErr("");
    try { const r = await api<{ signedUrl: string }>(`/api/clinics/${id}/session`, { json: { versionId: version._id } }); await s.start(r.signedUrl); }
    catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  }

  const actions = s.lines.filter((l) => l.role === "tool");
  return (
    <div className="grid lg:grid-cols-[.9fr_1.1fr] gap-4">
      <div className="card p-6 flex flex-col items-center text-center">
        <div className="w-[230px] h-[230px]"><Orb className="w-full h-full" getLevel={s.getLevel} /></div>
        <p className="mt-2 font-semibold text-[17px]">{live ? (s.status === "connecting" ? t("lcStarting") : s.isSpeaking ? t("lcSpeaking") : t("lcListening")) : t("version", { n: version.number })}</p>
        <p className="text-[14.5px] text-ink-2 mt-1 max-w-[340px]">{live ? t("lcInterrupt") : t("lcIdle")}</p>
        {(s.error || err) && <p className="text-fail text-[14px] mt-3" role="alert">{s.error ? t("micBlocked") : err}</p>}
        <div className="mt-5">
          {live ? <button className="btn btn-lg" onClick={() => s.endSession()}>{t("lcEnd")}</button>
            : <button className="btn btn-primary btn-lg" disabled={busy} onClick={start}><I.Mic className="w-5 h-5" /> {busy ? t("lcStarting") : t("lcStart")}</button>}
        </div>
        <dl className="mt-6 grid grid-cols-3 gap-2 w-full text-left">
          <Stat label={t("lcSpeed")} value={s.avgLatency != null ? `${(s.avgLatency / 1000).toFixed(1)} s` : "–"} />
          <Stat label={t("lcTurns")} value={String(s.lines.filter((l) => l.role !== "tool").length)} />
          <Stat label={t("lcActions")} value={String(actions.length)} />
        </dl>
      </div>
      <div className="card flex flex-col min-h-[440px]">
        <div className="px-5 py-3 border-b border-line"><h3 className="font-semibold">{t("lcTranscript")}</h3></div>
        <div ref={box} className="flex-1 overflow-y-auto p-5 space-y-2.5 max-h-[520px]" aria-live="polite">
          {s.lines.length === 0 && <p className="text-[14.5px] text-ink-3">{t("lcEmpty")}</p>}
          {s.lines.map((l, i) =>
            l.role === "tool" ? (
              <div key={i} className="flex justify-center"><span className={l.error ? "badge-fail" : "badge-pass"}><I.Calendar className="w-3.5 h-3.5" /> {actionLabel(l.text, t)}</span></div>
            ) : (
              <div key={i} className={`flex ${l.role === "user" ? "justify-end" : ""}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-[15px] ${l.role === "user" ? "bg-ink text-white rounded-br-md" : "bg-sunk rounded-bl-md"}`}>
                  <p className={`text-[11.5px] mb-0.5 ${l.role === "user" ? "text-white/60" : "text-ink-3"}`}>{l.role === "user" ? t("you") : t("prReceptionist")}{l.latencyMs != null && <span className="ml-2 tabular-nums">{(l.latencyMs / 1000).toFixed(1)} s</span>}</p>
                  {l.text}
                </div>
              </div>
            ),
          )}
        </div>
      </div>
    </div>
  );
}

// "book_slot → {...booking_id...}" becomes a plain label; no tool names on screen.
function actionLabel(text: string, t: ReturnType<typeof useT>) {
  const id = text.match(/bk_[0-9a-f]{6}/)?.[0];
  if (text.startsWith("book_slot")) return id ? `${t("lcBooked")} · ${id}` : t("lcBooked");
  if (text.startsWith("log_callback")) return t("lcCallbackNoted");
  return t("lcActionBooked");
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-[12px] bg-sunk px-3 py-2"><dt className="text-[11.5px] text-ink-3">{label}</dt><dd className="font-semibold tabular-nums">{value}</dd></div>;
}
