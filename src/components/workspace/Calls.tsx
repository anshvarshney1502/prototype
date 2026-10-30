"use client";
import { Fragment, useCallback, useEffect, useState } from "react";
import { api, type CallJ, type Workspace } from "@/lib/client";
import { useLang, useT, type Key } from "@/lib/i18n";

type Metrics = { total: number; booked: number; needsYou: number; avgDuration: number; resolved: number; positive: number };
const OUT: Record<string, [Key, string]> = {
  booked: ["outBooked", "badge-pass"], callback: ["outCallback", "badge-muted"], needs_you: ["outNeedsYou", "badge-fail"], answered: ["outAnswered", "badge-muted"], unresolved: ["outUnresolved", "badge-wait"],
};

export default function Calls({ id, data }: { id: string; data: Workspace }) {
  const t = useT();
  const { lang } = useLang();
  const when = (iso: string) => new Date(iso).toLocaleString(lang === "hi" ? "hi-IN" : "en-IN", { timeZone: "Asia/Kolkata", weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
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

  const stats: [Key, string | number][] = [
    ["clTotal", m?.total ?? "–"], ["clBookings", m?.booked ?? "–"], ["clNeedYou", m?.needsYou ?? "–"],
    ["clAvg", m ? `${m.avgDuration}s` : "–"], ["clResolved", m ? `${m.resolved}%` : "–"], ["clHappy", m ? `${m.positive}%` : "–"],
  ];
  return (
    <div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1">
          <h1 className="font-display text-[30px] sm:text-[36px] leading-tight">{t("clTitle")}</h1>
          <p className="text-ink-2 mt-2">{t("clSub")}</p>
        </div>
        <button className="btn" disabled={syncing} onClick={() => load(true)}>{syncing ? t("clSyncing") : t("clRefresh")}</button>
      </div>
      {err && <p className="text-fail text-[14px] mt-3" role="alert">{err}</p>}
      <dl className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map(([k, v]) => <div key={k} className="card px-4 py-3"><dt className="text-[13px] text-ink-3">{t(k)}</dt><dd className="font-display text-[28px] tabular-nums">{v}</dd></div>)}
      </dl>

      <div className="card mt-4 overflow-x-auto">
        <table className="w-full text-[14.5px]">
          <thead className="text-left text-[13px] text-ink-3 border-b border-line">
            <tr><th className="px-4 py-3 font-medium">{t("clTime")}</th><th className="px-4 py-3 font-medium">{t("clWhat")}</th><th className="px-4 py-3 font-medium">{t("clBooking")}</th><th className="px-4 py-3 font-medium">{t("clResult")}</th></tr>
          </thead>
          <tbody className="divide-y divide-line">
            {calls === null && <tr><td colSpan={4} className="px-4 py-6 text-ink-3">{t("loading")}</td></tr>}
            {calls?.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-ink-3 text-center">{t("clNone")}</td></tr>}
            {calls?.map((c) => (
              <Fragment key={c._id}>
                <tr className={`cursor-pointer ${c.flagged ? "bg-fail-soft/50" : "hover:bg-sunk/60"}`} onClick={() => setOpen(open === c._id ? null : c._id)}>
                  <td className="px-4 py-3 whitespace-nowrap">{when(c.startedAt)}<br /><span className="text-[12.5px] text-ink-3">{c.durationSecs}s</span></td>
                  <td className="px-4 py-3">{c.summary}{c.flagReason && <p className="text-[13px] text-fail mt-0.5">{c.flagReason}</p>}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-[13.5px]">{c.bookingIds.length ? <>{c.bookingIds.join(", ")} · <span className={c.bookingVerified ? "text-pass" : "text-fail"}>{c.bookingVerified ? t("clMatches") : t("clMissing")}</span></> : t("clNoneShort")}</td>
                  <td className="px-4 py-3"><span className={OUT[c.outcome]?.[1] ?? "badge-muted"}>{OUT[c.outcome] ? t(OUT[c.outcome][0]) : c.outcome}</span></td>
                </tr>
                {open === c._id && (
                  <tr><td colSpan={4} className="px-4 pb-4 bg-sunk/40">
                    <div className="space-y-1.5 pt-2 max-h-[320px] overflow-y-auto">
                      {c.transcript.map((x, i) => <p key={i} className="text-[14px]"><span className="text-ink-3 tabular-nums mr-2">{Math.round(x.t)}s</span><b>{x.role === "agent" ? t("prReceptionist") : t("clCaller")}:</b> {x.message}</p>)}
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
          <h3 className="font-semibold">{t("clCallbacks")}</h3>
          <ul className="mt-3 divide-y divide-line">
            {data.callbacks.length === 0 && <li className="text-[14.5px] text-ink-3 py-2">{t("clNoneShort")}</li>}
            {data.callbacks.map((c) => (
              <li key={c._id} className="py-3 text-[14.5px] flex gap-3">
                <span className={c.urgent ? "badge-fail" : "badge-muted"}>{c.urgent ? t("clUrgent") : t("clCallback")}</span>
                <span className="flex-1"><b>{c.name || t("clCaller")}</b> · <a className="underline underline-offset-2" href={`tel:${c.phone.replace(/\s/g, "")}`}>{c.phone}</a><br /><span className="text-ink-2">{c.reason}</span></span>
                <span className="text-[12.5px] text-ink-3 whitespace-nowrap">{when(c.createdAt)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="card p-5">
          <h3 className="font-semibold">{t("clUpcoming")}</h3>
          <ul className="mt-3 divide-y divide-line">
            {data.bookings.length === 0 && <li className="text-[14.5px] text-ink-3 py-2">{t("clNoneShort")}</li>}
            {data.bookings.map((b) => (
              <li key={b._id} className="py-3 text-[14.5px] flex gap-3">
                <span className="badge-pass text-[12px]">{b.bookingId}</span>
                <span className="flex-1"><b>{b.patientName}</b>{b.reason ? ` · ${b.reason}` : ""}</span>
                <span className="text-[13px] text-ink-2 whitespace-nowrap">{when(b.start)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
