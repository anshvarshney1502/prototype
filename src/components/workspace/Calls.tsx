"use client";
import { Fragment, useCallback, useEffect, useState } from "react";
import { api, fmtTime, type CallJ, type Workspace } from "@/lib/client";

type Metrics = { total: number; booked: number; needsYou: number; avgDuration: number; resolved: number; positive: number };
const OUT: Record<string, [string, string]> = {
  booked: ["Booked", "badge-pass"], callback: ["Callback", "badge-muted"], needs_you: ["Needs you", "badge-fail"], answered: ["Answered", "badge-muted"], unresolved: ["Unresolved", "badge-wait"],
};

export default function Calls({ id, data }: { id: string; data: Workspace }) {
  const [calls, setCalls] = useState<CallJ[] | null>(null);
  const [m, setM] = useState<Metrics | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [err, setErr] = useState("");

  const load = useCallback(async (sync = false) => {
    setSyncing(sync); setErr("");
    try { const r = await api<{ calls: CallJ[]; metrics: Metrics }>(`/api/clinics/${id}/calls${sync ? "?sync=1" : ""}`); setCalls(r.calls); setM(r.metrics); }
    catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setSyncing(false); }
  }, [id]);
  useEffect(() => { load(true); }, [load]);

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1">
          <h1 className="text-[28px] font-semibold">Calls</h1>
          <p className="text-ink-2 mt-1">Every conversation with what actually happened. A booking counts only when its ID exists in your calendar.</p>
        </div>
        <button className="btn" disabled={syncing} onClick={() => load(true)}>{syncing ? "Syncing from ElevenLabs…" : "Refresh"}</button>
      </div>
      {err && <p className="text-fail text-[14px] mt-3" role="alert">{err}</p>}

      <dl className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          ["Calls", m?.total ?? "–"], ["Bookings", m?.booked ?? "–"], ["Need you", m?.needsYou ?? "–"],
          ["Avg duration", m ? `${m.avgDuration}s` : "–"], ["Resolved", m ? `${m.resolved}%` : "–"], ["Positive", m ? `${m.positive}%` : "–"],
        ].map(([k, v]) => (
          <div key={k} className="card px-4 py-3"><dt className="text-[12.5px] text-ink-3">{k}</dt><dd className="text-[24px] font-semibold tabular-nums">{v}</dd></div>
        ))}
      </dl>

      <div className="card mt-4 overflow-x-auto">
        <table className="w-full text-[14px]">
          <thead className="text-left text-[12.5px] text-ink-3 border-b border-line">
            <tr><th className="px-4 py-3 font-medium">Time</th><th className="px-4 py-3 font-medium">What happened</th><th className="px-4 py-3 font-medium">Booking record</th><th className="px-4 py-3 font-medium">Version</th><th className="px-4 py-3 font-medium">Outcome</th></tr>
          </thead>
          <tbody className="divide-y divide-line">
            {calls === null && <tr><td colSpan={5} className="px-4 py-6 text-ink-3">Loading…</td></tr>}
            {calls?.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-ink-3">No calls yet. Talk to the receptionist from the share link or a test call, then refresh.</td></tr>}
            {calls?.map((c) => (
              <Fragment key={c._id}>
                <tr className={`cursor-pointer ${c.flagged ? "bg-fail-soft/50" : "hover:bg-sunk/60"}`} onClick={() => setOpen(open === c._id ? null : c._id)}>
                  <td className="px-4 py-3 whitespace-nowrap">{fmtTime(c.startedAt)}<br /><span className="text-[12px] text-ink-3">{c.durationSecs}s</span></td>
                  <td className="px-4 py-3">{c.summary}{c.flagReason && <p className="text-[12.5px] text-fail mt-0.5">{c.flagReason}</p>}</td>
                  <td className="px-4 py-3 font-mono text-[12.5px] whitespace-nowrap">{c.bookingIds.length ? `${c.bookingIds.join(", ")} · ${c.bookingVerified ? "matches" : "NOT FOUND"}` : "None"}</td>
                  <td className="px-4 py-3">{c.versionNumber ? `v${c.versionNumber}` : "–"}</td>
                  <td className="px-4 py-3"><span className={OUT[c.outcome]?.[1] ?? "badge-muted"}>{OUT[c.outcome]?.[0] ?? c.outcome}</span></td>
                </tr>
                {open === c._id && (
                  <tr><td colSpan={5} className="px-4 pb-4 bg-sunk/40">
                    <div className="space-y-1.5 pt-2 max-h-[320px] overflow-y-auto">
                      {c.transcript.map((t, i) => <p key={i} className="text-[13.5px]"><span className="text-ink-3 tabular-nums mr-2">{Math.round(t.t)}s</span><b>{t.role === "agent" ? "Receptionist" : "Caller"}:</b> {t.message}</p>)}
                    </div>
                  </td></tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 grid lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="font-semibold">Callbacks to make</h3>
          <ul className="mt-3 divide-y divide-line">
            {data.callbacks.length === 0 && <li className="text-[14px] text-ink-3 py-2">None.</li>}
            {data.callbacks.map((c) => (
              <li key={c._id} className="py-2.5 text-[14px] flex gap-3">
                <span className={c.urgent ? "badge-fail" : "badge-muted"}>{c.urgent ? "Urgent" : "Callback"}</span>
                <span className="flex-1"><b>{c.name || "Caller"}</b> · <span className="font-mono">{c.phone}</span><br /><span className="text-ink-2">{c.reason}</span></span>
                <span className="text-[12px] text-ink-3 whitespace-nowrap">{fmtTime(c.createdAt)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="card p-5">
          <h3 className="font-semibold">Upcoming bookings</h3>
          <ul className="mt-3 divide-y divide-line">
            {data.bookings.length === 0 && <li className="text-[14px] text-ink-3 py-2">None.</li>}
            {data.bookings.map((b) => (
              <li key={b._id} className="py-2.5 text-[14px] flex gap-3">
                <span className="font-mono text-[12.5px] badge-pass">{b.bookingId}</span>
                <span className="flex-1"><b>{b.patientName}</b> · {b.reason || "Appointment"}</span>
                <span className="text-[12.5px] text-ink-2 whitespace-nowrap">{fmtTime(b.start)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
