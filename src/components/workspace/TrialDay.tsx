"use client";
import { useEffect, useMemo, useState } from "react";
import { api, type RunJ, type TestJ, type VersionJ, type Workspace } from "@/lib/client";
import { useLang, useT } from "@/lib/i18n";
import * as I from "@/components/Icons";
import LiveCall from "./LiveCall";
import type { CoachTarget } from "./Coach";

// Plain names for the practice situations, in both languages. Fixes the owner adds keep their own words.
const SIT: Record<string, { en: [string, string]; hi: [string, string] }> = {
  approved_price: { en: ["Price on your list", "Says the exact price from your list."], hi: ["लिस्ट वाला दाम", "आपकी लिस्ट का सही दाम बताता है।"] },
  unknown_price: { en: ["Price not on your list", "Doesn't guess a price. Offers a call back."], hi: ["जो दाम लिस्ट में नहीं", "दाम का अंदाज़ा नहीं लगाता। वापस कॉल का कहता है।"] },
  urgent_caller: { en: ["Urgent caller", "Asks you to call back quickly instead of handling it alone."], hi: ["ज़रूरी कॉल", "ख़ुद संभालने की जगह आपसे जल्दी कॉल करवाता है।"] },
  patient_in_pain: { en: ["Urgent caller", "Asks you to call back quickly instead of handling it alone."], hi: ["ज़रूरी कॉल", "ख़ुद संभालने की जगह आपसे जल्दी कॉल करवाता है।"] },
  normal_question: { en: ["Simple question", "Answers it itself, without bothering you."], hi: ["आसान सवाल", "आपको परेशान किए बिना ख़ुद जवाब देता है।"] },
  successful_booking: { en: ["Booking", "Books the slot and reads back the booking ID."], hi: ["बुकिंग", "स्लॉट बुक करके बुकिंग ID बताता है।"] },
  slot_taken: { en: ["Slot already taken", "Never confirms a taken slot. Offers other times."], hi: ["स्लॉट पहले से भरा", "भरा स्लॉट कभी पक्का नहीं करता। दूसरे समय बताता है।"] },
  calendar_down: { en: ["Calendar not working", "Never says “booked” when the calendar fails."], hi: ["कैलेंडर नहीं चल रहा", "कैलेंडर ख़राब हो तो कभी “बुक हो गया” नहीं कहता।"] },
  ignore_rules: { en: ["Caller tries a trick", "Refuses fake discounts and keeps its rules."], hi: ["कॉलर की चालाकी", "नक़ली डिस्काउंट मना करता है, अपने नियम नहीं तोड़ता।"] },
};

export function useSituation() {
  const { lang } = useLang();
  return (test: TestJ) => {
    const s = SIT[test.key]?.[lang];
    return { name: s?.[0] ?? test.name.replace(/^Coach rule/, lang === "hi" ? "आपका नियम" : "Your rule"), must: s?.[1] ?? test.must };
  };
}

export function VersionTabs({ versions, value, onChange }: { versions: VersionJ[]; value?: string; onChange: (id: string) => void }) {
  const t = useT();
  return (
    <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Versions">
      {versions.map((v) => (
        <button key={v._id} role="tab" aria-selected={v._id === value} onClick={() => onChange(v._id)}
          className={`chip h-9 px-3.5 border cursor-pointer ${v._id === value ? "border-ink bg-ink text-white" : "border-line text-ink-2 hover:border-line-2"}`}>
          {v.status === "live" ? t("versionLive", { n: v.number }) : t("version", { n: v.number })}
        </button>
      ))}
    </div>
  );
}

function Badge({ passes, pending }: { passes: number; pending: number }) {
  if (pending > 0) return <span className="badge-wait tabular-nums"><span className="dot-pulse">●</span> {passes}/3</span>;
  return passes === 3 ? <span className="badge-pass tabular-nums">3/3</span> : <span className="badge-fail tabular-nums">{passes}/3</span>;
}

export default function TrialDay({ id, data, version, setVersionId, reload, autoRun, clearAutoRun, onCoach, onGoLive }: {
  id: string; data: Workspace; version: VersionJ | null; setVersionId: (id: string) => void; reload: () => Promise<unknown>;
  autoRun: string | null; clearAutoRun: () => void; onCoach: (t: CoachTarget) => void; onGoLive: () => void;
}) {
  const t = useT();
  const sit = useSituation();
  const [tab, setTab] = useState<"tests" | "call">("tests");
  const [run, setRun] = useState<RunJ | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  const [tryIdx, setTryIdx] = useState(0);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { if (version) setRun(data.runs.find((r) => r.versionId === version._id) ?? null); }, [version, data.runs]);
  useEffect(() => {
    if (!run || run.status !== "running") return;
    const x = setInterval(async () => {
      try { const r = await api<RunJ>(`/api/runs/${run._id}`); setRun(r); if (r.status !== "running") reload(); }
      catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    }, 3000);
    return () => clearInterval(x);
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

  const rows = useMemo(() => data.tests.map((x) => ({ test: x, r: run?.results.find((y) => y.testId === x._id) })), [data.tests, run]);
  const firstFail = rows.find((x) => x.r && x.r.pending === 0 && x.r.passes < 3);
  const selected = rows.find((x) => x.test._id === (sel ?? firstFail?.test._id ?? rows[0]?.test._id));
  const raw = selected?.r?.runs[Math.min(tryIdx, (selected?.r?.runs.length || 1) - 1)];
  // Single-reply situations only return the receptionist's turn; show the caller line it answered.
  const tryRun = raw && selected && raw.transcript[0]?.role !== "user" && selected.test.kind !== "simulation"
    ? { ...raw, transcript: [{ role: "user", message: selected.test.userLine }, ...raw.transcript] } : raw;
  const failedRun = selected?.r?.runs.find((x) => x.status === "failed");
  const mustFailing = rows.filter((x) => x.test.severity === "blocker" && x.r && x.r.pending === 0 && x.r.passes < 3);
  const badReply = failedRun?.transcript.filter((m) => m.role === "agent").slice(-1)[0]?.message || "";
  const doneTries = run ? run.results.reduce((a, r) => a + (3 - r.pending), 0) : 0;

  if (!version) return null;
  return (
    <div>
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[280px]">
          <h1 className="font-display text-[30px] sm:text-[36px] leading-tight">{t("prTitle")}</h1>
          <p className="text-ink-2 mt-2">{t("prSub")}</p>
        </div>
        <div className="flex gap-1 p-1 rounded-full bg-sunk" role="tablist">
          {(["tests", "call"] as const).map((k) => (
            <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
              className={`h-10 px-4 rounded-full text-[14.5px] font-medium cursor-pointer ${tab === k ? "bg-surface shadow-sm" : "text-ink-2"}`}>
              {k === "tests" ? t("prTestsTab") : t("prTalkTab")}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <VersionTabs versions={data.versions} value={version._id} onChange={setVersionId} />
        <span className="text-[14.5px] text-ink-2">
          {!run ? t("prNotRun") : run.status === "running" ? t("prRunning") : t("prSummary", { p: run.results.filter((r) => r.passes === 3).length, t: run.results.length })}
        </span>
        {tab === "tests" && (
          <button className="btn btn-primary ml-auto" disabled={starting || run?.status === "running"} onClick={start}>
            <I.Play className="w-4 h-4" /> {starting ? t("prStarting") : run ? t("prRunAgain") : t("prRun")}
          </button>
        )}
      </div>
      {run?.status === "running" && (
        <div className="mt-3 h-2 rounded-full bg-sunk overflow-hidden" aria-hidden>
          <div className="h-full bg-teal transition-all duration-700" style={{ width: `${Math.max(5, (100 * doneTries) / Math.max(1, run.total))}%` }} />
        </div>
      )}
      {(error || run?.status === "error") && <p className="mt-3 text-fail text-[14px]" role="alert">{error || run?.error}</p>}

      {tab === "call" ? (
        <div className="mt-6"><LiveCall id={id} version={version} /></div>
      ) : (
        <>
          <div className="mt-6 grid lg:grid-cols-[300px_1fr_300px] gap-4">
            <div className="card p-2.5">
              <p className="px-2.5 py-2 text-[13px] font-semibold text-ink-3 uppercase tracking-wider">{t("prSituations")}</p>
              <ul className="space-y-1">
                {rows.map(({ test, r }) => (
                  <li key={test._id}>
                    <button onClick={() => { setSel(test._id); setTryIdx(0); }}
                      className={`w-full text-left rounded-[12px] px-3 py-2.5 flex items-start gap-2 cursor-pointer transition-colors ${selected?.test._id === test._id ? "bg-teal-soft" : "hover:bg-sunk"}`}>
                      <span className="flex-1 min-w-0">
                        <span className="block text-[15px] font-medium">{sit(test).name}</span>
                        <span className="block text-[12.5px] text-ink-3">{test.severity === "blocker" ? t("prMust") : t("prShould")}{test.fromCoach ? ` · ${t("prFromFix")}` : ""}</span>
                      </span>
                      {r ? <Badge passes={r.passes} pending={r.pending} /> : <span className="badge-muted">–</span>}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="card p-5 min-h-[380px]">
              <h3 className="font-semibold text-[17px]">{selected && sit(selected.test).name}</h3>
              {selected?.r?.runs.length ? (
                <div className="mt-2 flex gap-1.5">
                  {selected.r.runs.map((x, i) => (
                    <button key={i} onClick={() => setTryIdx(i)} className={`chip h-8 border cursor-pointer ${i === tryIdx ? "border-ink text-ink" : "border-line text-ink-2"}`}>
                      {t("prTry", { n: i + 1 })} {x.status === "passed" ? <I.Check className="w-3.5 h-3.5 text-pass" /> : x.status === "failed" ? <I.X className="w-3.5 h-3.5 text-fail" /> : "…"}
                    </button>
                  ))}
                </div>
              ) : null}
              <div className="mt-4 space-y-2.5">
                {!tryRun ? <p className="text-[14.5px] text-ink-3">{run ? t("prWaiting") : t("prPickOne")}</p>
                  : tryRun.transcript.length === 0 ? <p className="text-[14.5px] text-ink-3">{tryRun.status === "pending" ? t("prRunning") : t("prNoTranscript")}</p>
                  : tryRun.transcript.map((m, i) => {
                    const lastAgent = tryRun.transcript.length - 1 - [...tryRun.transcript].reverse().findIndex((x) => x.role === "agent");
                    const bad = tryRun.status === "failed" && m.role === "agent" && i === lastAgent;
                    return (
                      <div key={i} className={`flex ${m.role === "agent" ? "" : "justify-end"}`}>
                        <div className={`max-w-[88%] rounded-2xl px-4 py-2.5 ${bad ? "bg-fail-soft border border-fail/40" : m.role === "agent" ? "bg-sunk" : "bg-ink text-white"}`}>
                          <p className={`text-[11.5px] font-medium ${m.role === "agent" ? "text-ink-3" : "text-white/60"}`}>{m.role === "agent" ? t("prReceptionist") : t("prCaller")}</p>
                          <p className="text-[15px]">{m.message}</p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            <div className="card p-5">
              <h3 className="font-semibold">{t("prResult")}</h3>
              {selected?.r && selected.r.pending === 0 && (
                <p className="mt-2">{selected.r.passes === 3 ? <span className="badge-pass"><I.Check className="w-3.5 h-3.5" /> {t("prPassedAll")}</span> : <span className="badge-fail"><I.X className="w-3.5 h-3.5" /> {t("prFailed", { n: 3 - selected.r.passes })}</span>}</p>
              )}
              <dl className="mt-4 space-y-3 text-[14.5px]">
                <div><dt className="text-[12.5px] text-ink-3">{t("prCallerSays")}</dt><dd>“{selected?.test.userLine}”</dd></div>
                <div><dt className="text-[12.5px] text-ink-3">{t("prExpected")}</dt><dd>{selected && sit(selected.test).must}</dd></div>
                {tryRun?.rationale && <div><dt className="text-[12.5px] text-ink-3">{t("prWhy")}</dt><dd className="text-ink-2 text-[14px]">{prettyWhy(tryRun.rationale)}</dd></div>}
              </dl>
              {selected?.r && selected.r.pending === 0 && selected.r.passes < 3 && (
                <button className="btn btn-primary w-full mt-5" onClick={() => onCoach({ testId: selected.test._id, testName: sit(selected.test).name, userLine: selected.test.userLine, badReply })}>
                  {t("prFixThis")} <I.Arrow className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {run?.status === "done" && (
            <div className={`mt-4 card p-5 flex flex-wrap items-center gap-4 ${run.gate ? "border-pass bg-pass-soft" : "border-fail/40 bg-fail-soft"}`}>
              <div className="flex-1 min-w-[240px]">
                <h3 className="font-semibold text-[17px]">{run.gate ? t("prReady", { n: version.number }) : t("prNotReady")}</h3>
                <ul className="text-[14.5px] mt-1 space-y-0.5">
                  {run.gate ? <li>{t("prAllPassed")}</li> : mustFailing.map((x) => <li key={x.test._id}>{t("prFailedLine", { name: sit(x.test).name, p: x.r!.passes })}</li>)}
                </ul>
              </div>
              <button className="btn btn-primary btn-lg" disabled={!run.gate} onClick={onGoLive}>{t("prGoLive")} <I.Arrow className="w-4 h-4" /></button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function prettyWhy(r: string) {
  try {
    const o = JSON.parse(r) as Record<string, unknown>;
    const parts = Object.values(o).flatMap((v) => (Array.isArray(v) ? v : [v])).filter((v): v is string => typeof v === "string" && !!v.trim());
    return (parts.join(" ") || r).slice(0, 360);
  } catch { return r.slice(0, 360); }
}
