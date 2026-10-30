"use client";
import { useEffect, useRef, useState } from "react";
import Orb from "@/components/OrbLazy";
import { MicIcon } from "@/components/Builder";
import { VoiceProvider, useVoiceSession } from "@/components/voice";
import { api } from "@/lib/client";

// Public share link: what a patient sees. Only the live, tested version answers.
export default function Talk({ id }: { id: string }) {
  return <VoiceProvider><Inner id={id} /></VoiceProvider>;
}

function Inner({ id }: { id: string }) {
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
      <div className="w-full max-w-[460px] card p-6 text-center">
        <p className="eyebrow">{name || "Clinic receptionist"}</p>
        <h1 className="text-[24px] font-semibold mt-1">Talk to our receptionist</h1>
        <p className="text-[14px] text-ink-2">AI assistant · English or Hindi</p>
        <div className="w-[220px] h-[220px] mx-auto mt-2"><Orb className="w-full h-full" getLevel={s.getLevel} /></div>
        <p className="text-[14px] text-ink-2 min-h-[20px]">{live ? (s.isSpeaking ? "Speaking…" : "Listening…") : ""}</p>
        {(err || s.error) && <p className="text-fail text-[14px] mt-2" role="alert">{err || s.error}</p>}
        <div className="mt-4">
          {live ? <button className="btn btn-lg w-full" onClick={() => s.endSession()}>End call</button>
            : <button className="btn btn-primary btn-lg w-full" disabled={busy} onClick={start}><MicIcon /> {busy ? "Connecting…" : "Start a call"}</button>}
        </div>
        {s.lines.length > 0 && (
          <div ref={box} className="mt-5 text-left max-h-[240px] overflow-y-auto space-y-2 border-t border-line pt-4">
            {s.lines.filter((l) => l.role !== "tool").map((l, i) => <p key={i} className="text-[14px]"><b>{l.role === "agent" ? "Receptionist" : "You"}:</b> {l.text}</p>)}
          </div>
        )}
        <p className="text-[12px] text-ink-3 mt-5">You’re speaking with an AI receptionist. Calls are recorded so the clinic can follow up. Powered by Munshi on ElevenLabs.</p>
      </div>
    </main>
  );
}
