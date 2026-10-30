"use client";
import { useMemo, useRef, useState } from "react";
import * as I from "@/components/Icons";
import { api, type VersionJ, type Workspace } from "@/lib/client";
import { useT, type Key } from "@/lib/i18n";
import { useSituation } from "./TrialDay";

export type CoachTarget = { testId: string; testName: string; userLine: string; badReply: string };
type Result = { versionId: string; number: number; rule: { field: string; before: string; after: string; summary: string } };
const FIELD: Record<string, Key> = { ifUnsure: "fIfUnsure", never: "fNever", handoff: "fHandoff", booking: "fBooking", extraRule: "rulesAdded" };

export default function Coach({ id, data, version, target, onNewVersion }: {
  id: string; data: Workspace; version: VersionJ | null; target: CoachTarget | null; onNewVersion: (versionId: string, run: boolean) => void;
}) {
  const t = useT();
  const sit = useSituation();
  // Without a picked failure, offer the failures from this version's latest practice.
  const failures = useMemo(() => {
    const run = data.runs.find((r) => r.versionId === version?._id && r.status === "done");
    return (run?.results ?? []).filter((r) => r.passes < 3).map((r) => {
      const test = data.tests.find((x) => x._id === r.testId);
      const bad = r.runs.find((x) => x.status === "failed")?.transcript.filter((m) => m.role === "agent").slice(-1)[0]?.message || "";
      return test ? { testId: test._id, testName: sit(test).name, userLine: test.userLine, badReply: bad } : null;
    }).filter(Boolean) as CoachTarget[];
  }, [data, version, sit]);
  const [pick, setPick] = useState<CoachTarget | null>(target ?? failures[0] ?? null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const cur = target ?? pick;

  async function save() {
    if (!cur) return;
    setBusy(true); setErr("");
    try { setResult(await api<Result>(`/api/clinics/${id}/coach`, { json: { testId: cur.testId, correction: text, badReply: cur.badReply } })); }
    catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  }

  return (
    <div>
      <h1 className="font-display text-[30px] sm:text-[36px] leading-tight">{t("fxTitle")}</h1>
      <p className="text-ink-2 mt-2">{t("fxSub")}</p>
      <div className="mt-6 grid lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="font-semibold">{t("fxMoment")}</h3>
          {!cur ? <p className="text-[14.5px] text-ink-3 mt-3">{t("fxNone")}</p> : (
            <>
              {!target && failures.length > 1 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {failures.map((f) => <button key={f.testId} className={`chip h-9 border cursor-pointer ${f.testId === cur.testId ? "border-ink text-ink" : "border-line text-ink-2"}`} onClick={() => setPick(f)}>{f.testName}</button>)}
                </div>
              )}
              <div className="mt-4 space-y-2">
                <div className="flex justify-end"><p className="max-w-[88%] rounded-2xl rounded-br-md bg-ink text-white px-4 py-2.5 text-[15px]">{cur.userLine}</p></div>
                {cur.badReply && <div><p className="max-w-[88%] rounded-2xl rounded-bl-md bg-fail-soft border border-fail/40 px-4 py-2.5 text-[15px]">{cur.badReply}</p></div>}
              </div>
              <p className="mt-3 text-[14.5px]"><b className="text-fail">{t("fxFailed")}</b> {cur.testName}</p>
              <label htmlFor="fix" className="block mt-5 text-[15px] font-semibold">{t("fxQuestion")}</label>
              <textarea id="fix" className="field mt-2 min-h-[100px]" maxLength={600} value={text} onChange={(e) => setText(e.target.value)} placeholder={t("fxPlaceholder")} />
              {err && <p className="text-fail text-[14px] mt-2" role="alert">{err}</p>}
              <div className="mt-3 flex gap-2">
                <SayIt onText={(s) => setText((x) => (x ? x + " " : "") + s)} />
                <button className="btn btn-primary ml-auto" disabled={busy || text.trim().length < 8 || !!result} onClick={save}>{busy ? t("fxSaving") : t("fxSave")}</button>
              </div>
            </>
          )}
        </div>

        <div className="card p-5">
          <h3 className="font-semibold">{t("fxChanges")}</h3>
          {!result ? <p className="text-[14.5px] text-ink-3 mt-3">{t("fxPreview")}</p> : (
            <div className="rise">
              <p className="text-[13.5px] text-ink-2 mt-3">{t("fxLine", { f: t(FIELD[result.rule.field] ?? "rulesAdded") })}</p>
              <p className="mt-2 rounded-[12px] bg-fail-soft px-3 py-2 text-[15px] line-through text-fail">{result.rule.before || t("fxOldLine")}</p>
              <p className="mt-2 rounded-[12px] bg-pass-soft px-3 py-2 text-[15px] text-pass">{result.rule.after}</p>
              <p className="text-[14px] text-ink-2 mt-3">{t("fxAlsoTest")}</p>
              <p className="text-[13.5px] text-ink-3 mt-2">{t("fxSafe", { a: version?.number ?? 1, b: result.number })}</p>
              <button className="btn btn-primary btn-lg w-full mt-4" onClick={() => onNewVersion(result.versionId, true)}><I.Play className="w-4 h-4" /> {t("fxPractise", { n: result.number })}</button>
            </div>
          )}
        </div>
      </div>
      <Refine id={id} onNewVersion={onNewVersion} />
    </div>
  );
}

// Change anything in plain words ("make the greeting shorter", "add Hindi"). Each change is a new version.
function Refine({ id, onNewVersion }: { id: string; onNewVersion: (versionId: string, run: boolean) => void }) {
  const t = useT();
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
      setLog((l) => [...l, { q, a: t("rfSaved", { s: r.summary, n: r.number }), versionId: r.versionId, n: r.number }]);
    } catch (er) { setLog((l) => [...l, { q, a: er instanceof Error ? er.message : String(er), err: true }]); }
    finally { setBusy(false); }
  }
  return (
    <div className="card p-5 mt-4">
      <h3 className="font-semibold">{t("rfTitle")}</h3>
      <p className="text-[14.5px] text-ink-2 mt-1">{t("rfSub")}</p>
      <ul className="mt-3 space-y-2">
        {log.map((m, i) => (
          <li key={i} className="text-[14.5px]">
            <p className="text-ink-2">{t("you")}: {m.q}</p>
            <p className={m.err ? "text-fail" : ""}>{m.a} {m.versionId && <button className="text-teal font-medium underline underline-offset-2 cursor-pointer" onClick={() => onNewVersion(m.versionId!, true)}>{t("rfPractise", { n: m.n! })}</button>}</p>
          </li>
        ))}
      </ul>
      <form onSubmit={send} className="mt-3 flex gap-2">
        <input className="field" maxLength={600} value={text} onChange={(e) => setText(e.target.value)} placeholder={t("rfPlaceholder")} />
        <SayIt onText={(s) => setText(s)} compact />
        <button className="btn btn-primary" disabled={busy || !text.trim()}>{busy ? t("rfApplying") : t("rfApply")}</button>
      </form>
    </div>
  );
}

// Record in the browser, turn speech into text on the server.
function SayIt({ onText, compact }: { onText: (t: string) => void; compact?: boolean }) {
  const t = useT();
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
        stream.getTracks().forEach((x) => x.stop());
        setState("busy");
        try {
          const fd = new FormData();
          fd.append("audio", new Blob(chunks, { type: r.mimeType || "audio/webm" }), "fix.webm");
          const res = await api<{ text: string }>("/api/stt", { method: "POST", body: fd });
          if (res.text) onText(res.text);
        } catch (e) { alert(e instanceof Error ? e.message : String(e)); }
        finally { setState("idle"); }
      };
      rec.current = r; r.start(); setState("rec");
    } catch { alert(t("micBlocked")); }
  }
  return (
    <button type="button" className={`btn ${state === "rec" ? "border-fail text-fail" : ""}`} onClick={toggle} disabled={state === "busy"} aria-pressed={state === "rec"} aria-label={t("fxSay")}>
      <I.Mic className="w-4 h-4" /> {state === "rec" ? t("fxStop") : state === "busy" ? t("fxListening") : compact ? "" : t("fxSay")}
    </button>
  );
}
