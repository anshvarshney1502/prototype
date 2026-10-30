"use client";
import { useEffect, useState } from "react";
import { api, type VersionJ, type Workspace } from "@/lib/client";
import { useT } from "@/lib/i18n";
import * as I from "@/components/Icons";
import { VersionTabs } from "./TrialDay";

export default function GoLive({ id, data, version, setVersionId, reload, onTrial }: {
  id: string; data: Workspace; version: VersionJ | null; setVersionId: (id: string) => void; reload: () => Promise<unknown>; onTrial: () => void;
}) {
  const t = useT();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  if (!version) return null;

  const run = data.runs.find((r) => r.versionId === version._id);
  const ready = run?.status === "done" && run.gate;
  const live = data.versions.find((v) => v.status === "live");
  const snippet = `<elevenlabs-convai agent-id="${data.clinic.agentId}"></elevenlabs-convai>\n<script src="https://unpkg.com/@elevenlabs/convai-widget-embed" async type="text/javascript"></script>`;
  const link = `${origin}/talk/${id}`;
  async function go() {
    setBusy(true); setErr("");
    try { await api(`/api/versions/${version!._id}/golive`, { method: "POST" }); await reload(); }
    catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  }
  const copy = (k: string, v: string) => navigator.clipboard.writeText(v).then(() => { setCopied(k); setTimeout(() => setCopied(""), 1500); });
  const Item = ({ ok, children }: { ok: boolean; children: React.ReactNode }) => (
    <li className="flex items-start gap-2">{ok ? <I.Check className="w-5 h-5 text-pass shrink-0" /> : <I.X className="w-5 h-5 text-fail shrink-0" />}<span>{children}</span></li>
  );

  return (
    <div>
      <h1 className="font-display text-[30px] sm:text-[36px] leading-tight">{live ? t("glLiveTitle") : t("glTitle")}</h1>
      <p className="text-ink-2 mt-2">{live ? t("glLiveSub") : t("glSub")}</p>
      <div className="mt-5"><VersionTabs versions={data.versions} value={version._id} onChange={setVersionId} /></div>

      <div className="mt-5 grid lg:grid-cols-2 gap-4">
        <div className={`card p-6 ${ready ? "border-pass" : ""}`}>
          <h3 className="font-semibold text-[17px]">{t("version", { n: version.number })}</h3>
          <ul className="mt-4 space-y-2.5 text-[15px]">
            <Item ok={!!run && run.status === "done"}>{!run ? t("glPractisedNot") : run.status === "running" ? t("glPractising") : t("glRuns", { p: run.passed, t: run.total })}</Item>
            <Item ok={!!ready}>{ready ? t("glGate") : t("glGateNo")}</Item>
            <Item ok>{t("glAi")}</Item>
            <Item ok>{t("glBookings")}</Item>
          </ul>
          {err && <p className="text-fail text-[14px] mt-3" role="alert">{err}</p>}
          <div className="mt-6">
            {version.status === "live" ? <span className="badge-pass h-11 px-4 text-[15px]"><I.Check className="w-4 h-4" /> {t("glIsLive", { n: version.number })}</span>
              : ready ? <button className="btn btn-primary btn-lg" disabled={busy} onClick={go}>{busy ? t("glGoing") : t("glButton", { n: version.number })}</button>
              : <button className="btn btn-lg" onClick={onTrial}>{t("glToPractice")}</button>}
          </div>
        </div>

        <div className="card p-6">
          <h3 className="font-semibold text-[17px]">{t("glWhere")}</h3>
          {!live ? <p className="text-[14.5px] text-ink-3 mt-2">{t("glWhereNo")}</p> : (
            <div className="space-y-5 mt-4">
              <div>
                <p className="text-[15px] font-medium">{t("glLink")}</p>
                <div className="mt-1.5 flex gap-2">
                  <input readOnly className="field text-[14px]" value={link} aria-label={t("glLink")} />
                  <button className="btn" onClick={() => copy("link", link)}>{copied === "link" ? t("glCopied") : t("glCopy")}</button>
                  <a className="btn btn-primary" href={link} target="_blank">{t("glOpen")}</a>
                </div>
              </div>
              <div>
                <p className="text-[15px] font-medium">{t("glWebsite")}</p>
                <p className="text-[13.5px] text-ink-2">{t("glWebsiteSub")}</p>
                <pre className="mt-2 rounded-[12px] bg-sunk p-3 text-[12px] font-mono whitespace-pre-wrap break-all">{snippet}</pre>
                <button className="btn mt-2" onClick={() => copy("code", snippet)}>{copied === "code" ? t("glCopied") : t("glCopyCode")}</button>
              </div>
              <div className="rounded-[12px] border border-dashed border-line-2 p-4">
                <p className="text-[15px] font-medium flex items-center gap-2"><I.Phone className="w-4 h-4" /> {t("glPhone")} <span className="badge-muted">{t("glPhoneSoon")}</span></p>
                <p className="text-[13.5px] text-ink-2 mt-1">{t("glPhoneSub")}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
