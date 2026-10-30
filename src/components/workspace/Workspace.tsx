"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import { api, type Workspace as WS } from "@/lib/client";
import Interview from "./Interview";
import JobCardStep from "./JobCardStep";
import TrialDay from "./TrialDay";
import Coach, { type CoachTarget } from "./Coach";
import GoLive from "./GoLive";
import Calls from "./Calls";
import HowItWorks from "./HowItWorks";

export type Step = "interview" | "jobcard" | "trial" | "coach" | "live" | "calls";
const STEPS: { key: Step; label: string; n?: number }[] = [
  { key: "interview", label: "Interview", n: 1 },
  { key: "jobcard", label: "Job card", n: 2 },
  { key: "trial", label: "Trial Day", n: 3 },
  { key: "coach", label: "Coach", n: 4 },
  { key: "live", label: "Go live", n: 5 },
  { key: "calls", label: "Calls" },
];

export default function Workspace({ id, initialStep }: { id: string; initialStep?: string }) {
  const [data, setData] = useState<WS | null>(null);
  const [error, setError] = useState("");
  const [step, setStep] = useState<Step | null>((STEPS.find((s) => s.key === initialStep)?.key as Step) ?? null);
  const [versionId, setVersionId] = useState<string | null>(null);
  const [coachTarget, setCoachTarget] = useState<CoachTarget | null>(null);
  const [autoRun, setAutoRun] = useState<string | null>(null);
  const [drawer, setDrawer] = useState(false);

  const reload = useCallback(async () => {
    try {
      const d = await api<WS>(`/api/clinics/${id}`);
      setData(d);
      setError("");
      return d;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return null;
    }
  }, [id]);

  useEffect(() => { reload(); }, [reload]);

  const created = !!data?.clinic.agentId;
  const current = step ?? (data ? defaultStep(data) : null);
  const version = useMemo(() => {
    if (!data?.versions.length) return null;
    return data.versions.find((v) => v._id === versionId) ?? data.versions[data.versions.length - 1];
  }, [data, versionId]);

  function done(key: Step) {
    if (!data) return false;
    if (key === "interview") return created || data.clinic.stage !== "interview";
    if (key === "jobcard") return created;
    if (key === "trial") return data.runs.some((r) => r.status === "done");
    if (key === "coach") return data.versions.length > 1;
    if (key === "live") return data.clinic.stage === "live";
    return false;
  }
  const locked = (key: Step) => !created && ["trial", "coach", "live", "calls"].includes(key);

  return (
    <>
      <Header right={<button className="btn" onClick={() => setDrawer(true)}>How this works</button>} />
      <div className="bg-surface border-b border-line">
        <div className="mx-auto max-w-[1240px] px-4 sm:px-6 py-3 flex items-center gap-4 overflow-x-auto">
          <div className="min-w-0 shrink-0">
            <p className="text-[12.5px] text-ink-3">Receptionist for</p>
            <p className="font-semibold truncate max-w-[240px]">{data?.clinic.card.clinicName ?? "…"}</p>
          </div>
          <nav aria-label="Steps" className="flex items-center gap-1 ml-auto">
            {STEPS.filter((s) => s.key !== "interview" || !created).map((s) => {
              const active = current === s.key;
              return (
                <button
                  key={s.key}
                  disabled={locked(s.key)}
                  aria-current={active ? "step" : undefined}
                  onClick={() => setStep(s.key)}
                  className={`flex items-center gap-2 h-9 px-3 rounded-full text-[14px] font-medium whitespace-nowrap transition-colors disabled:opacity-40 ${active ? "bg-teal-soft text-teal" : "text-ink-2 hover:bg-sunk"}`}
                >
                  {s.n != null && (
                    <span className={`grid place-items-center w-5 h-5 rounded-full text-[11.5px] ${done(s.key) ? "bg-pass text-white" : active ? "bg-teal text-white" : "border border-line-2"}`}>
                      {done(s.key) ? "✓" : s.n}
                    </span>
                  )}
                  {s.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      <main className="mx-auto max-w-[1240px] px-4 sm:px-6 py-6 sm:py-8">
        {error && <div className="card border-fail bg-fail-soft text-fail p-4 mb-4" role="alert">{error}</div>}
        {!data ? (
          <div className="card p-10 text-center text-ink-2">Loading…</div>
        ) : current === "interview" ? (
          <Interview id={id} data={data} onCard={(card) => setData((d) => (d ? { ...d, clinic: { ...d.clinic, card } } : d))} onDone={() => { reload(); setStep("jobcard"); }} />
        ) : current === "jobcard" ? (
          <JobCardStep id={id} data={data} reload={reload} onCreated={async (vid) => { await reload(); setVersionId(vid); setAutoRun(vid); setStep("trial"); }} />
        ) : current === "trial" ? (
          <TrialDay id={id} data={data} version={version} setVersionId={setVersionId} reload={reload} autoRun={autoRun} clearAutoRun={() => setAutoRun(null)}
            onCoach={(t) => { setCoachTarget(t); setStep("coach"); }} onGoLive={() => setStep("live")} />
        ) : current === "coach" ? (
          <Coach id={id} data={data} version={version} target={coachTarget} reload={reload}
            onNewVersion={async (vid, run) => { await reload(); setVersionId(vid); setCoachTarget(null); if (run) { setAutoRun(vid); setStep("trial"); } }} />
        ) : current === "live" ? (
          <GoLive id={id} data={data} version={version} setVersionId={setVersionId} reload={reload} onTrial={() => setStep("trial")} />
        ) : (
          <Calls id={id} data={data} />
        )}
      </main>
      <HowItWorks open={drawer} onClose={() => setDrawer(false)} step={current ?? "interview"} />
    </>
  );
}

function defaultStep(d: WS): Step {
  if (!d.clinic.agentId) return d.clinic.stage === "interview" ? "interview" : "jobcard";
  if (d.clinic.stage === "live") return "calls";
  return "trial";
}
