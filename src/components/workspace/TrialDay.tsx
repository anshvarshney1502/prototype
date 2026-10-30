"use client";
import { useEffect, useMemo, useState } from "react";
import { api, type RunJ, type VersionJ, type Workspace } from "@/lib/client";
import LiveCall from "./LiveCall";
import type { CoachTarget } from "./Coach";

export function VersionTabs({ versions, value, onChange }: { versions: VersionJ[]; value?: string; onChange: (id: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Versions">
      {versions.map((v) => (
        <button key={v._id} role="tab" aria-selected={v._id === value} onClick={() => onChange(v._id)}
          className={`chip border h-8 px-3 ${v._id === value ? "border-teal bg-teal-soft text-teal" : "border-line text-ink-2"}`}>
          Version {v.number}{v.status === "live" ? " · live" : ""}
        </button>
      ))}
    </div>
  );
}

export function badge(passes: number, pending: number, total = 3) {
  if (pending > 0 && passes + pending === total && passes === 0) return <span className="badge-wait"><span className="dot-pulse">●</span> Running</span>;
  if (pending > 0) return <span className="badge-wait tabular-nums">{passes}/{total} · running</span>;
  return passes === total ? <span className="badge-pass tabular-nums">{passes}/{total}</span> : <span className="badge-fail tabular-nums">{passes}/{total}</span>;
}

export default function TrialDay({ id, data, version, setVersionId, reload, autoRun, clearAutoRun, onCoach, onGoLive }: {
  id: string; data: Workspace; version: VersionJ | null; setVersionId: (id: string) => void; reload: () => Promise<unknown>;
  autoRun: string | null; clearAutoRun: () => void; onCoach: (t: CoachTarget) => void; onGoLive: () => void;
}) {
  const [tab, setTab] = useState<"tests" | "call">("tests");
  const [run, setRun] = useState<RunJ | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  const [runIdx, setRunIdx] = useState(0);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  // Show this version's latest run.
  useEffect(() => {
    if (!version) return;
    setRun(data.runs.find((r) => r.versionId === version._id) ?? null);
  }, [version, data.runs]);

  // Poll while ElevenLabs works through the runs.
  useEffect(() => {
    if (!run || run.status !== "running") return;
    const t = setInterval(async () => {
      try {
        const r = await api<RunJ>(`/api/runs/${run._id}`);
        setRun(r);
        if (r.status !== "running") reload();
      } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    }, 3000);
    return () => clearInterval(t);
  }, [run, reload]);

  async function start() {
    if (!version) return;
    setStarting(true); setError("");
    try { const r = await api<{ run: RunJ }>(`/api/versions/${version._id}/run`, { method: "POST" }); setRun(r.run); setSel(null); }
    catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setStarting(false); }
  }

  useEffect(() => {
    if (autoRun && version?._id === autoRun) { clearAutoRun(); start(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRun, version?._id]);

  const rows = useMemo(() => data.tests.map((t) => ({ t, r: run?.results.find((x) => x.testId === t._id) })), [data.tests, run]);
  const firstFail = rows.find((x) => x.r && x.r.pending === 0 && x.r.passes < 3);
  const selected = rows.find((x) => x.t._id === (sel ?? firstFail?.t._id ?? rows[0]?.t._id));
  const rawRun = selected?.r?.runs[Math.min(runIdx, (selected?.r?.runs.length || 1) - 1)];
  // Next-reply and tool tests only return the agent's turn; show the caller line it answered.
  const selRun = rawRun && selected && rawRun.transcript[0]?.role !== "user" && selected.t.kind !== "simulation"
    ? { ...rawRun, transcript: [{ role: "user", message: selected.t.userLine }, ...rawRun.transcript] }
    : rawRun;
  const failedRun = selected?.r?.runs.find((x) => x.status === "failed");
  const blockersFailing = rows.filter((x) => x.t.severity === "blocker" && x.r && x.r.pending === 0 && x.r.passes < 3);
  const badReply = (failedRun?.transcript.filter((m) => m.role === "agent").slice(-1)[0]?.message) || "";

  if (!version) return <div className="card p-8 text-ink-2">Create the receptionist first.</div>;

  return (
    <div>
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[280px]">
          <h1 className="text-[28px] font-semibold">Trial Day: test the receptionist before any patient calls</h1>
          <p className="text-ink-2 mt-1">Each test is a situation with an expected result. Every test runs three times against the same version, because one good answer is not proof.</p>
        </div>
        <div className="flex gap-1 p-1 rounded-[12px] bg-sunk" role="tablist">
          <button role="tab" aria-selected={tab === "tests"} className={`h-9 px-4 rounded-[9px] text-[14px] font-medium ${tab === "tests" ? "bg-surface shadow-sm" : "text-ink-2"}`} onClick={() => setTab("tests")}>Test suite</button>
          <button role="tab" aria-selected={tab === "call"} className={`h-9 px-4 rounded-[9px] text-[14px] font-medium ${tab === "call" ? "bg-surface shadow-sm" : "text-ink-2"}`} onClick={() => setTab("call")}>Live voice call</button>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <VersionTabs versions={data.versions} value={version._id} onChange={setVersionId} />
        <span className="text-[14px] text-ink-2">
          {!run ? "Not run yet" : run.status === "running" ? `Running on version ${version.number}…` : `${run.results.filter((r) => r.passes === 3).length} of ${run.results.length} passed on all 3 runs · ${run.passed}/${run.total} runs`}
        </span>
        {tab === "tests" && (
          <button className="btn btn-primary ml-auto" disabled={starting || run?.status === "running"} onClick={start}>
            {starting ? "Starting…" : run ? "Run again" : `Run all ${data.tests.length} tests, 3 times each`}
          </button>
        )}
      </div>
      {run?.status === "running" && (
        <div className="mt-3 h-1.5 rounded-full bg-sunk overflow-hidden" aria-hidden>
          <div className="h-full bg-teal transition-all duration-700" style={{ width: `${Math.max(6, (100 * run.results.reduce((s, r) => s + (3 - r.pending), 0)) / Math.max(1, run.total))}%` }} />
        </div>
      )}
      {error && <p className="mt-3 text-fail text-[14px]" role="alert">{error}</p>}

      {tab === "call" ? (
        <div className="mt-5"><LiveCall id={id} version={version} /></div>
      ) : (
        <>
          <div className="mt-5 grid lg:grid-cols-[300px_1fr_320px] gap-4">
            <div className="card p-3">
              <div className="flex items-center px-2 pb-2"><h3 className="font-semibold">Tests</h3><span className="ml-auto text-[12.5px] text-ink-3">3 runs</span></div>
              <ul className="space-y-1">
                {rows.map(({ t, r }) => (
                  <li key={t._id}>
                    <button onClick={() => { setSel(t._id); setRunIdx(0); }}
                      className={`w-full text-left rounded-[10px] px-3 py-2.5 flex items-start gap-2 ${selected?.t._id === t._id ? "bg-teal-soft" : "hover:bg-sunk"}`}>
                      <span className="flex-1 min-w-0">
                        <span className="block text-[14.5px] font-medium">{t.name}</span>
                        <span className="block text-[12px] text-ink-3">{t.severity === "blocker" ? "Blocker" : "High"} · {t.method}{t.fromCoach ? " · from Coach" : ""}</span>
                      </span>
                      {r ? badge(r.passes, r.pending) : <span className="badge-muted">–</span>}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="card p-5 min-h-[360px]">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{selected?.t.name}</h3>
                <span className="ml-auto text-[12.5px] text-ink-3">Version {version.number}</span>
              </div>
              {selected?.r?.runs.length ? (
                <div className="mt-2 flex gap-1">
                  {selected.r.runs.map((x, i) => (
                    <button key={i} onClick={() => setRunIdx(i)} className={`chip h-7 border ${i === runIdx ? "border-teal text-teal" : "border-line text-ink-2"}`}>
                      Run {i + 1} {x.status === "passed" ? "✓" : x.status === "failed" ? "✕" : "…"}
                    </button>
                  ))}
                </div>
              ) : null}
              <div className="mt-4 space-y-3">
                {!selRun ? (
                  <p className="text-[14px] text-ink-3">{run ? "Waiting for this test's first run…" : "Run the tests, then select one to read its conversation."}</p>
                ) : selRun.transcript.length === 0 ? (
                  <p className="text-[14px] text-ink-3">{selRun.status === "pending" ? "Running…" : "No transcript returned for this run."}</p>
                ) : (
                  selRun.transcript.map((m, i) => {
                    const bad = selRun.status === "failed" && m.role === "agent" && i === selRun.transcript.length - 1 - [...selRun.transcript].reverse().findIndex((x) => x.role === "agent");
                    return (
                      <div key={i} className={`rounded-[10px] px-3 py-2 ${bad ? "bg-fail-soft border-l-4 border-fail" : ""}`}>
                        <p className="text-[11.5px] font-semibold text-ink-3">{m.role === "agent" ? "Receptionist" : "Caller"}</p>
                        <p className="text-[14.5px]">{m.message}</p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="card p-5">
              <h3 className="font-semibold">Evidence</h3>
              {selected?.r && selected.r.pending === 0 && (
                <p className="mt-2">{selected.r.passes === 3 ? <span className="badge-pass">● Passed 3 of 3</span> : <span className="badge-fail">● Failed {3 - selected.r.passes} of 3</span>}</p>
              )}
              <dl className="mt-3 space-y-3 text-[14px]">
                <div><dt className="text-[12px] text-ink-3">Caller says</dt><dd>“{selected?.t.userLine}”</dd></div>
                <div><dt className="text-[12px] text-ink-3">Expected</dt><dd>{selected?.t.must}</dd></div>
                {selRun?.rationale && <div><dt className="text-[12px] text-ink-3">Why the check decided this</dt><dd className="text-ink-2 text-[13px] break-words">{prettyRationale(selRun.rationale)}</dd></div>}
                <div><dt className="text-[12px] text-ink-3">Tested against</dt><dd className="font-mono text-[12px] break-all">Version {version.number} · {version.elVersionId}</dd></div>
              </dl>
              {selected?.r && selected.r.pending === 0 && selected.r.passes < 3 && (
                <button className="btn btn-primary w-full mt-4" onClick={() => onCoach({ testId: selected.t._id, testName: selected.t.name, userLine: selected.t.userLine, badReply })}>
                  Coach this response
                </button>
              )}
            </div>
          </div>

          {run?.status === "done" && (
            <div className={`mt-4 card p-5 flex flex-wrap items-center gap-3 ${run.gate ? "border-pass bg-pass-soft" : "border-fail bg-fail-soft"}`}>
              <div className="flex-1 min-w-[240px]">
                <h3 className="font-semibold">{run.gate ? `Version ${version.number} is ready to go live` : "Not ready to go live"}</h3>
                <ul className="text-[14px] mt-1 list-disc pl-5">
                  {run.gate ? <li>Every blocker passed 3 of 3.</li> : blockersFailing.map((x) => <li key={x.t._id}><b>{x.t.name}</b> passed {x.r!.passes} of 3 runs (blocker).</li>)}
                </ul>
              </div>
              <button className="btn btn-primary" disabled={!run.gate} onClick={onGoLive}>Go live</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function prettyRationale(r: string) {
  try {
    const o = JSON.parse(r) as Record<string, unknown>;
    const parts = Object.values(o).flatMap((v) => (Array.isArray(v) ? v : [v])).map((v) => (typeof v === "string" ? v : typeof v === "object" && v ? Object.values(v).filter((x) => typeof x === "string").join(" ") : "")).filter(Boolean);
    return parts.join(" ").slice(0, 400) || r;
  } catch { return r; }
}
