"use client";
import { useEffect, useState } from "react";
import { api, type VersionJ, type Workspace } from "@/lib/client";
import { VersionTabs } from "./TrialDay";

export default function GoLive({ id, data, version, setVersionId, reload, onTrial }: {
  id: string; data: Workspace; version: VersionJ | null; setVersionId: (id: string) => void; reload: () => Promise<unknown>; onTrial: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  if (!version) return <div className="card p-8 text-ink-2">Create the receptionist first.</div>;

  const run = data.runs.find((r) => r.versionId === version._id);
  const ready = run?.status === "done" && run.gate;
  const live = data.versions.find((v) => v.status === "live");
  const agentId = data.clinic.agentId;
  const snippet = `<elevenlabs-convai agent-id="${agentId}"></elevenlabs-convai>\n<script src="https://unpkg.com/@elevenlabs/convai-widget-embed" async type="text/javascript"></script>`;
  const talk = `${origin}/talk/${id}`;

  async function go() {
    setBusy(true); setErr("");
    try { await api(`/api/versions/${version!._id}/golive`, { method: "POST" }); await reload(); }
    catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  }
  const copy = (k: string, v: string) => navigator.clipboard.writeText(v).then(() => { setCopied(k); setTimeout(() => setCopied(""), 1500); });

  return (
    <div>
      <h1 className="text-[28px] font-semibold">{live ? "Your receptionist is live" : "Go live"}</h1>
      <p className="text-ink-2 mt-1">{live ? "Patients talk to the tested version only. Every call is listed under Calls with what actually happened." : "Only a version that passed every blocker test 3 of 3 can answer patients."}</p>
      <div className="mt-4"><VersionTabs versions={data.versions} value={version._id} onChange={setVersionId} /></div>

      <div className="mt-4 grid lg:grid-cols-2 gap-4">
        <div className={`card p-5 ${ready ? "border-pass" : ""}`}>
          <h3 className="font-semibold">Version {version.number}</h3>
          <p className="text-[14px] text-ink-2 mt-1">{version.reason}</p>
          <ul className="mt-3 space-y-1.5 text-[14px]">
            <li>{run ? (run.status === "running" ? "⏳ Tests are running" : `${run.passed}/${run.total} test runs passed`) : "✕ Tests have not been run on this version"}</li>
            <li>{ready ? "✓ Every blocker passed 3 of 3" : "✕ Not every blocker has passed 3 of 3"}</li>
            <li>✓ Callers are told they are speaking with an AI</li>
            <li>✓ Bookings count only with a calendar booking ID</li>
          </ul>
          {err && <p className="text-fail text-[14px] mt-3" role="alert">{err}</p>}
          <div className="mt-4 flex gap-2">
            {version.status === "live" ? <span className="badge-pass h-10 px-4 text-[14px]">● Version {version.number} is live</span>
              : ready ? <button className="btn btn-primary btn-lg" disabled={busy} onClick={go}>{busy ? "Going live…" : `Put version ${version.number} live`}</button>
              : <button className="btn btn-lg" onClick={onTrial}>Go to Trial Day</button>}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold">Where patients reach it</h3>
          {!live ? <p className="text-[14px] text-ink-3 mt-2">Available once a version is live.</p> : (
            <div className="space-y-4 mt-3">
              <div>
                <p className="text-[14px] font-medium">Share link</p>
                <div className="mt-1 flex gap-2"><input readOnly className="field font-mono text-[13px]" value={talk} /><button className="btn" onClick={() => copy("link", talk)}>{copied === "link" ? "Copied" : "Copy"}</button><a className="btn btn-primary" href={talk} target="_blank">Open</a></div>
              </div>
              <div>
                <p className="text-[14px] font-medium">Add it to your website</p>
                <p className="text-[13px] text-ink-2">Paste this before the closing body tag. The widget always uses the live version.</p>
                <pre className="mt-1 rounded-[10px] bg-sunk p-3 text-[12px] font-mono whitespace-pre-wrap break-all">{snippet}</pre>
                <button className="btn mt-2" onClick={() => copy("code", snippet)}>{copied === "code" ? "Copied" : "Copy code"}</button>
              </div>
              <div className="rounded-[10px] border border-dashed border-line-2 p-3">
                <p className="text-[14px] font-medium">Phone number <span className="badge-muted ml-1">Not connected</span></p>
                <p className="text-[13px] text-ink-2 mt-1">Connect a Twilio or SIP number to agent <span className="font-mono">{agentId}</span> in ElevenLabs (Agents → Phone numbers). It answers with the same live version. We add it only after a real call has been routed and tested end to end.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
