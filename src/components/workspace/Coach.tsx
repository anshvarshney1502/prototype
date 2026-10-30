"use client";
import { useMemo, useRef, useState } from "react";
import { MicIcon } from "@/components/Builder";
import { api, type VersionJ, type Workspace } from "@/lib/client";

export type CoachTarget = { testId: string; testName: string; userLine: string; badReply: string };
type Result = { versionId: string; number: number; rule: { field: string; before: string; after: string; summary: string } };
const FIELD: Record<string, string> = { ifUnsure: "If unsure", never: "Never", handoff: "Pass to a person", booking: "Booking", extraRule: "Rules you added" };

export default function Coach({ id, data, version, target, onNewVersion }: {
  id: string; data: Workspace; version: VersionJ | null; target: CoachTarget | null; reload: () => Promise<unknown>; onNewVersion: (versionId: string, run: boolean) => void;
}) {
  // Without an explicit target, offer the failures from this version's latest run.
  const failures = useMemo(() => {
    const run = data.runs.find((r) => r.versionId === version?._id && r.status === "done");
    return (run?.results ?? []).filter((r) => r.passes < 3).map((r) => {
      const t = data.tests.find((x) => x._id === r.testId);
      const bad = r.runs.find((x) => x.status === "failed")?.transcript.filter((m) => m.role === "agent").slice(-1)[0]?.message || "";
      return t ? { testId: t._id, testName: t.name, userLine: t.userLine, badReply: bad } : null;
    }).filter(Boolean) as CoachTarget[];
  }, [data, version]);
  const [pick, setPick] = useState<CoachTarget | null>(target ?? failures[0] ?? null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const t = target ?? pick;

  async function save() {
    if (!t) return;
    setBusy(true); setErr("");
    try { setResult(await api<Result>(`/api/clinics/${id}/coach`, { json: { testId: t.testId, correction: text, badReply: t.badReply } })); }
    catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  }

  return (
    <div>
      <h1 className="text-[28px] font-semibold">Coach the response that went wrong</h1>
      <p className="text-ink-2 mt-1">Say what the receptionist should have done. Munshi turns it into a rule on the job card, creates a new version and runs every test again.</p>
      <div className="mt-5 grid lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="font-semibold">The failed moment</h3>
          {!t ? (
            <p className="text-[14px] text-ink-3 mt-3">No failed test on version {version?.number ?? "–"}. Run Trial Day first, or use Refine below to change anything in plain words.</p>
          ) : (
            <>
              {!target && failures.length > 1 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {failures.map((f) => <button key={f.testId} className={`chip border ${f.testId === t.testId ? "border-teal text-teal" : "border-line text-ink-2"}`} onClick={() => setPick(f)}>{f.testName}</button>)}
                </div>
              )}
              <div className="mt-3 space-y-2">
                <div className="rounded-[10px] px-3 py-2"><p className="text-[11.5px] font-semibold text-ink-3">Caller</p><p>{t.userLine}</p></div>
                {t.badReply && <div className="rounded-[10px] px-3 py-2 bg-fail-soft border-l-4 border-fail"><p className="text-[11.5px] font-semibold text-ink-3">Receptionist</p><p>{t.badReply}</p></div>}
              </div>
              <p className="mt-3 text-[14px]"><b className="text-fail">Test failed:</b> {t.testName}</p>
              <label htmlFor="fix" className="block mt-4 text-[14px] font-medium">What should the receptionist have done differently?</label>
              <textarea id="fix" className="field mt-2 min-h-[96px]" maxLength={600} value={text} onChange={(e) => setText(e.target.value)}
                placeholder="For example: if a price isn't on my list, don't guess. Say you'll confirm and take a callback number." />
              {err && <p className="text-fail text-[14px] mt-2" role="alert">{err}</p>}
              <div className="mt-3 flex gap-2">
                <SayIt onText={(s) => setText((x) => (x ? x + " " : "") + s)} />
                <button className="btn btn-primary ml-auto" disabled={busy || text.trim().length < 8 || !!result} onClick={save}>{busy ? "Writing the rule…" : "Save as rule"}</button>
              </div>
            </>
          )}
        </div>

        <div className="card p-5">
          <h3 className="font-semibold">What changes</h3>
          {!result ? (
            <p className="text-[14px] text-ink-3 mt-3">Write or say a correction to preview the change.</p>
          ) : (
            <div className="rise">
              <p className="text-[13px] text-ink-2 mt-3">Job card line “{FIELD[result.rule.field] ?? result.rule.field}”</p>
              {result.rule.before && <p className="mt-2 rounded-[10px] bg-fail-soft px-3 py-2 text-[14px] line-through text-fail">{result.rule.before}</p>}
              {!result.rule.before && result.rule.field === "ifUnsure" && <p className="mt-2 rounded-[10px] bg-fail-soft px-3 py-2 text-[14px] line-through text-fail">Not mentioned. The receptionist will answer as best it can.</p>}
              <p className="mt-2 rounded-[10px] bg-pass-soft px-3 py-2 text-[14px] text-pass">{result.rule.after}</p>
              <p className="text-[13px] text-ink-2 mt-3">Also added: a permanent test that runs on every future version.</p>
              <div className="mt-3 flex items-center gap-2 text-[14px]">
                <span className="badge-muted">Version {version?.number} · stays untouched</span><span aria-hidden>→</span><span className="chip bg-teal-soft text-teal">Version {result.number} · new candidate</span>
              </div>
              <p className="text-[13px] text-ink-3 mt-2">Version {result.number} is a separate branch on ElevenLabs, so a bad correction can never reach patients.</p>
              <button className="btn btn-primary w-full mt-4" onClick={() => onNewVersion(result.versionId, true)}>Run all tests on version {result.number}</button>
            </div>
          )}
        </div>
      </div>
      <Refine id={id} onNewVersion={onNewVersion} />
    </div>
  );
}

// Plain-language edits ("make the greeting shorter and warmer", "add Hindi"). Each becomes a new version.
function Refine({ id, onNewVersion }: { id: string; onNewVersion: (versionId: string, run: boolean) => void }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<{ q: string; a: string; versionId?: string; n?: number; err?: boolean }[]>([]);
  async function send(e: React.FormEvent) {
    e.preventDefault();
    const q = text.trim();
    if (!q) return;
    setBusy(true); setText("");
    try {
      const r = await api<{ versionId: string; number: number; summary: string }>(`/api/clinics/${id}/refine`, { json: { instruction: q } });
      setLog((l) => [...l, { q, a: `${r.summary}. Saved as version ${r.number}.`, versionId: r.versionId, n: r.number }]);
    } catch (err) { setLog((l) => [...l, { q, a: err instanceof Error ? err.message : String(err), err: true }]); }
    finally { setBusy(false); }
  }
  return (
    <div className="card p-5 mt-4">
      <h3 className="font-semibold">Refine in plain words</h3>
      <p className="text-[14px] text-ink-2 mt-1">Change tone, greeting, languages or rules. Every change becomes a new version that has to pass Trial Day.</p>
      <ul className="mt-3 space-y-2">
        {log.map((m, i) => (
          <li key={i} className="text-[14px]">
            <p className="text-ink-2">You: {m.q}</p>
            <p className={m.err ? "text-fail" : ""}>{m.a} {m.versionId && <button className="text-teal font-medium underline underline-offset-2" onClick={() => onNewVersion(m.versionId!, true)}>Test version {m.n}</button>}</p>
          </li>
        ))}
      </ul>
      <form onSubmit={send} className="mt-3 flex gap-2">
        <input className="field" maxLength={600} value={text} onChange={(e) => setText(e.target.value)} placeholder="Make the welcome message shorter and warmer" />
        <SayIt onText={(s) => setText(s)} compact />
        <button className="btn btn-primary" disabled={busy || !text.trim()}>{busy ? "Changing…" : "Apply"}</button>
      </form>
    </div>
  );
}

// "Say it instead": record in the browser, transcribe with ElevenLabs Scribe v2 on the server.
function SayIt({ onText, compact }: { onText: (t: string) => void; compact?: boolean }) {
  const [state, setState] = useState<"idle" | "rec" | "busy">("idle");
  const rec = useRef<MediaRecorder | null>(null);
  async function toggle() {
    if (state === "rec") { rec.current?.stop(); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks: Blob[] = [];
      const r = new MediaRecorder(stream);
      r.ondataavailable = (e) => chunks.push(e.data);
      r.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setState("busy");
        try {
          const fd = new FormData();
          fd.append("audio", new Blob(chunks, { type: r.mimeType || "audio/webm" }), "fix.webm");
          const res = await api<{ text: string }>("/api/stt", { method: "POST", body: fd });
          if (res.text) onText(res.text);
        } catch (e) { alert(e instanceof Error ? e.message : String(e)); }
        finally { setState("idle"); }
      };
      rec.current = r;
      r.start();
      setState("rec");
    } catch { alert("Microphone access was blocked."); }
  }
  return (
    <button type="button" className={`btn ${state === "rec" ? "border-fail text-fail" : ""}`} onClick={toggle} disabled={state === "busy"} aria-pressed={state === "rec"}>
      <MicIcon /> {state === "rec" ? "Stop" : state === "busy" ? "Listening…" : compact ? "" : "Say it instead"}
    </button>
  );
}
