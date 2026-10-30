"use client";
import { useEffect, useRef, useState } from "react";
import Orb from "@/components/OrbLazy";
import * as I from "@/components/Icons";
import { LogoMark } from "@/components/Logo";
import { VoiceProvider, useVoiceSession } from "@/components/voice";
import { api } from "@/lib/client";
import { LangToggle, useT } from "@/lib/i18n";

// What a customer sees from the share link. Only the live, practised version answers.
export default function Talk({ id }: { id: string }) {
  return <VoiceProvider><Inner id={id} /></VoiceProvider>;
}

function Inner({ id }: { id: string }) {
  const t = useT();
  const s = useVoiceSession();
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const live = s.status === "connected" || s.status === "connecting";
  useEffect(() => { box.current?.scrollTo({ top: box.current.scrollHeight }); }, [s.lines.length]);

  async function start() {
    setBusy(true); setErr("");
    try { const r = await api<{ signedUrl: string; clinicName: string }>(`/api/public/${id}/session`, { method: "POST" }); setName(r.clinicName); await s.start(r.signedUrl); }
    catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  }

  return (
    <main className="min-h-dvh grid place-items-center px-4 py-10">
      <div className="w-full max-w-[460px]">
        <div className="flex justify-end mb-3"><LangToggle /></div>
        <div className="card p-7 text-center shadow-[0_30px_60px_-34px_rgba(27,36,48,.35)]">
          {name && <p className="text-[13px] font-semibold text-saffron-ink uppercase tracking-wider">{name}</p>}
          <h1 className="font-display text-[28px] mt-1 leading-tight">{t("tkTitle")}</h1>
          <p className="text-[14.5px] text-ink-2 mt-1">{t("tkSub")}</p>
          <div className="w-[220px] h-[220px] mx-auto mt-2"><Orb className="w-full h-full" getLevel={s.getLevel} /></div>
          <p className="text-[14.5px] text-ink-2 min-h-[22px]">{live ? (s.isSpeaking ? t("lcSpeaking") : t("lcListening")) : ""}</p>
          {(err || s.error) && <p className="text-fail text-[14px] mt-2" role="alert">{s.error ? t("micBlocked") : err}</p>}
          <div className="mt-4">
            {live ? <button className="btn btn-lg w-full" onClick={() => s.endSession()}>{t("tkEnd")}</button>
              : <button className="btn btn-primary btn-lg w-full" disabled={busy} onClick={start}><I.Phone className="w-5 h-5" /> {busy ? t("tkConnecting") : t("tkStart")}</button>}
          </div>
          {s.lines.some((l) => l.role !== "tool") && (
            <div ref={box} className="mt-5 text-left max-h-[240px] overflow-y-auto space-y-2 border-t border-line pt-4">
              {s.lines.filter((l) => l.role !== "tool").map((l, i) => <p key={i} className="text-[14.5px]"><b>{l.role === "agent" ? t("prReceptionist") : t("you")}:</b> {l.text}</p>)}
            </div>
          )}
          <p className="text-[12.5px] text-ink-3 mt-5">{t("tkNote")}</p>
        </div>
        <p className="mt-4 flex items-center justify-center gap-2 text-[13px] text-ink-3"><LogoMark size={18} /> Munshi</p>
      </div>
    </main>
  );
}
