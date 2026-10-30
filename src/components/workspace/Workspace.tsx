"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api, type Workspace as WS } from "@/lib/client";
import { LangToggle, useT, type Key } from "@/lib/i18n";
import { Logo } from "@/components/Logo";
import Interview from "./Interview";
import JobCardStep from "./JobCardStep";
import TrialDay from "./TrialDay";
import Coach, { type CoachTarget } from "./Coach";
import GoLive from "./GoLive";
import Calls from "./Calls";

export type Step = "interview" | "jobcard" | "trial" | "coach" | "live" | "calls";
const STEPS: { key: Step; label: Key; n?: number }[] = [
  { key: "interview", label: "stepExplain", n: 1 },
  { key: "jobcard", label: "stepCard", n: 2 },
  { key: "trial", label: "stepTest", n: 3 },
  { key: "coach", label: "stepFix", n: 4 },
  { key: "live", label: "stepLive", n: 5 },
  { key: "calls", label: "stepCalls" },
];

export default function Workspace({ id, initialStep }: { id: string; initialStep?: string }) {
  const t = useT();
  const [data, setData] = useState<WS | null>(null);
  const [error, setError] = useState("");
  const [step, setStep] = useState<Step | null>((STEPS.find((s) => s.key === initialStep)?.key as Step) ?? null);
  const [versionId, setVersionId] = useState<string | null>(null);
  const [coachTarget, setCoachTarget] = useState<CoachTarget | null>(null);
  const [autoRun, setAutoRun] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const d = await api<WS>(`/api/clinics/${id}`);
      setData(d); setError("");
      return d;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(/access/i.test(msg) ? t("noAccess") : msg);
      return null;
    }
  }, [id, t]);
  useEffect(() => { reload(); }, [reload]);

  const created = !!data?.clinic.agentId;
  const current = step ?? (data ? defaultStep(data) : null);
  const version = useMemo(() => {
    if (!data?.versions.length) return null;
    return data.versions.find((v) => v._id === versionId) ?? data.versions[data.versions.length - 1];
  }, [data, versionId]);

  const done = (k: Step) => {
    if (!data) return false;
    if (k === "interview") return created || data.clinic.stage !== "interview";
    if (k === "jobcard") return created;
    if (k === "trial") return data.runs.some((r) => r.status === "done");
    if (k === "coach") return data.versions.length > 1;
    if (k === "live") return data.clinic.stage === "live";
    return false;
  };
  const locked = (k: Step) => !created && ["trial", "coach", "live", "calls"].includes(k);
  const go = (k: Step) => { setStep(k); window.scrollTo({ top: 0, behavior: "smooth" }); };

  return (
    <>
      <header className="sticky top-0 z-30 bg-surface/95 backdrop-blur border-b border-line">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 h-16 flex items-center gap-3">
          <Link href="/" aria-label="Munshi home"><Logo size={28} /></Link>
          <div className="hidden md:block pl-3 ml-1 border-l border-line min-w-0">
            <p className="text-[12px] text-ink-3 leading-none">{t("receptionistFor")}</p>
            <p className="font-semibold truncate max-w-[260px] mt-1">{data?.clinic.card.clinicName ?? "…"}</p>
          </div>
          <LangToggle className="ml-auto" />
        </div>
        <nav aria-label="Steps" className="mx-auto max-w-[1200px] px-4 sm:px-6 pb-2 flex gap-1 overflow-x-auto">
          {STEPS.filter((s) => s.key !== "interview" || !created).map((s) => {
            const active = current === s.key;
            return (
              <button key={s.key} disabled={locked(s.key)} aria-current={active ? "step" : undefined} onClick={() => go(s.key)}
                className={`flex items-center gap-2 h-10 px-3.5 rounded-full text-[14.5px] font-medium whitespace-nowrap cursor-pointer transition-colors disabled:opacity-35 disabled:cursor-not-allowed ${active ? "bg-ink text-white" : "text-ink-2 hover:bg-sunk"}`}>
                {s.n != null && (
                  <span className={`grid place-items-center w-5 h-5 rounded-full text-[11.5px] ${done(s.key) ? "bg-pass text-white" : active ? "bg-white text-ink" : "border border-line-2"}`}>
                    {done(s.key) ? "✓" : s.n}
                  </span>
                )}
                {t(s.label)}
              </button>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto max-w-[1200px] px-4 sm:px-6 py-7 sm:py-10">
        {error && <div className="card border-fail bg-fail-soft text-fail p-4 mb-4" role="alert">{error}</div>}
        {!data ? (
          !error && <div className="card p-10 text-center text-ink-2">{t("loading")}</div>
        ) : current === "interview" ? (
          <Interview id={id} data={data} onCard={(card) => setData((d) => (d ? { ...d, clinic: { ...d.clinic, card } } : d))} onDone={() => { reload(); go("jobcard"); }} />
        ) : current === "jobcard" ? (
          <JobCardStep id={id} data={data} reload={reload} onCreated={async (vid) => { await reload(); setVersionId(vid); setAutoRun(vid); go("trial"); }} />
        ) : current === "trial" ? (
          <TrialDay id={id} data={data} version={version} setVersionId={setVersionId} reload={reload} autoRun={autoRun} clearAutoRun={() => setAutoRun(null)}
            onCoach={(x) => { setCoachTarget(x); go("coach"); }} onGoLive={() => go("live")} />
        ) : current === "coach" ? (
          <Coach id={id} data={data} version={version} target={coachTarget}
            onNewVersion={async (vid, run) => { await reload(); setVersionId(vid); setCoachTarget(null); if (run) { setAutoRun(vid); go("trial"); } }} />
        ) : current === "live" ? (
          <GoLive id={id} data={data} version={version} setVersionId={setVersionId} reload={reload} onTrial={() => go("trial")} />
        ) : (
          <Calls id={id} data={data} />
        )}
      </main>
    </>
  );
}

function defaultStep(d: WS): Step {
  if (!d.clinic.agentId) return d.clinic.stage === "interview" ? "interview" : "jobcard";
  if (d.clinic.stage === "live") return "calls";
  return "trial";
}
