"use client";
import { useEffect, useRef, useState } from "react";
import Orb from "@/components/OrbLazy";
import { MicIcon } from "@/components/Builder";
import { VoiceProvider, useVoiceSession } from "@/components/voice";
import { api, type VersionJ } from "@/lib/client";

// Real-time test mode: talk to the exact version in the browser and see transcript, latency and tool calls.
export default function LiveCall(props: { id: string; version: VersionJ; publicMode?: boolean }) {
  return <VoiceProvider><Inner {...props} /></VoiceProvider>;
}

function Inner({ id, version, publicMode }: { id: string; version: VersionJ; publicMode?: boolean }) {
  const s = useVoiceSession();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const box = useRef<HTMLDivElement>(null);
  const live = s.status === "connected" || s.status === "connecting";
  useEffect(() => { box.current?.scrollTo({ top: box.current.scrollHeight, behavior: "smooth" }); }, [s.lines.length]);

  async function start() {
    setBusy(true); setErr("");
    try {
      const r = await api<{ signedUrl: string }>(publicMode ? `/api/public/${id}/session` : `/api/clinics/${id}/session`, { json: { versionId: version._id } });
      await s.start(r.signedUrl);
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  }

  const tools = s.lines.filter((l) => l.role === "tool");
  return (
    <div className="grid lg:grid-cols-[.9fr_1.1fr] gap-4">
      <div className="card p-6 flex flex-col items-center text-center">
        <div className="w-[240px] h-[240px]"><Orb className="w-full h-full" getLevel={s.getLevel} /></div>
        <p className="mt-2 font-semibold">{live ? (s.status === "connecting" ? "Connecting…" : s.isSpeaking ? "Receptionist is speaking" : "Listening to you") : `Version ${version.number}`}</p>
        <p className="text-[14px] text-ink-2 mt-1 max-w-[340px]">{live ? "Talk over it any time: it stops and listens." : "You play the patient. Try a price that isn't on the list, or ask to book."}</p>
        {(s.error || err) && <p className="text-fail text-[14px] mt-3" role="alert">{s.error || err}</p>}
        <div className="mt-5">
          {live ? <button className="btn btn-lg" onClick={() => s.endSession()}>End call</button>
            : <button className="btn btn-primary btn-lg" disabled={busy} onClick={start}><MicIcon /> {busy ? "Starting…" : "Start test call"}</button>}
        </div>
        <dl className="mt-6 grid grid-cols-3 gap-3 w-full text-left">
          <Stat label="Avg reply latency" value={s.avgLatency != null ? `${s.avgLatency} ms` : "–"} />
          <Stat label="Turns" value={String(s.lines.filter((l) => l.role !== "tool").length)} />
          <Stat label="Tool calls" value={String(tools.length)} />
        </dl>
      </div>
      <div className="card flex flex-col min-h-[440px]">
        <div className="px-5 py-3 border-b border-line flex items-center"><h3 className="font-semibold">Transcript</h3><span className="ml-auto text-[12.5px] text-ink-3">Latency is from the end of your turn to the reply starting</span></div>
        <div ref={box} className="flex-1 overflow-y-auto p-5 space-y-2.5 max-h-[520px]" aria-live="polite">
          {s.lines.length === 0 && <p className="text-[14px] text-ink-3">Start the call to see each reply, its latency and the tools it used.</p>}
          {s.lines.map((l, i) =>
            l.role === "tool" ? (
              <div key={i} className={`font-mono text-[12px] rounded-[8px] px-3 py-1.5 ${l.error ? "bg-fail-soft text-fail" : "bg-sunk text-ink-2"}`}>tool · {l.text}</div>
            ) : (
              <div key={i} className={`flex ${l.role === "user" ? "justify-end" : ""}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-[14.5px] ${l.role === "user" ? "bg-teal-soft" : "bg-sunk"}`}>
                  <p className="text-[11.5px] text-ink-3 mb-0.5">{l.role === "user" ? "You" : "Receptionist"}{l.latencyMs != null && <span className="ml-2 tabular-nums">{l.latencyMs} ms</span>}</p>
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

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-[12px] bg-sunk px-3 py-2"><dt className="text-[11.5px] text-ink-3">{label}</dt><dd className="font-semibold tabular-nums">{value}</dd></div>;
}
