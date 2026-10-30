"use client";
import { useEffect, useRef, useState } from "react";
import { api, type Workspace } from "@/lib/client";
import { INTERVIEW_FIELDS, type JobCard } from "@/lib/jobcard";
import CardView from "./CardView";

type Voice = { id: string; owner?: string; name: string; preview: string; labels: Record<string, string>; description: string };

export default function JobCardStep({ id, data, reload, onCreated }: { id: string; data: Workspace; reload: () => Promise<unknown>; onCreated: (versionId: string) => void }) {
  const created = !!data.clinic.agentId;
  const [card, setCard] = useState<JobCard>(data.clinic.card);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => setCard(data.clinic.card), [data.clinic.card]);

  if (created) {
    const live = data.versions.find((v) => v.status === "live");
    return (
      <div className="grid lg:grid-cols-[1fr_.8fr] gap-6">
        <div>
          <h1 className="text-[28px] font-semibold">The job card your receptionist follows</h1>
          <p className="text-ink-2 mt-1">Showing the latest version. Changes now go through Coach or Refine, so every change becomes a new version that is tested before patients hear it.</p>
          <div className="mt-5"><CardView card={data.versions[data.versions.length - 1]?.card ?? card} /></div>
        </div>
        <aside className="lg:pt-[76px] space-y-4">
          <div className="card p-5">
            <h3 className="font-semibold">Versions</h3>
            <ul className="mt-3 space-y-2">
              {data.versions.map((v) => (
                <li key={v._id} className="flex items-start gap-3 text-[14px]">
                  <span className="badge-muted tabular-nums">v{v.number}</span>
                  <span className="flex-1 text-ink-2">{v.reason}</span>
                  {v.status === "live" ? <span className="badge-pass">Live</span> : v.passedGate ? <span className="badge-pass">Passed</span> : null}
                </li>
              ))}
            </ul>
            {!live && <p className="text-[13px] text-ink-3 mt-3">Nothing is live yet.</p>}
          </div>
        </aside>
      </div>
    );
  }

  const set = <K extends keyof JobCard>(k: K, v: JobCard[K]) => setCard((c) => ({ ...c, [k]: v }));

  async function save(next = card) {
    setSaving(true); setError("");
    try { await api(`/api/clinics/${id}`, { method: "PATCH", json: { card: next } }); await reload(); }
    catch (e) { setError(e instanceof Error ? e.message : String(e)); throw e; }
    finally { setSaving(false); }
  }

  async function approve() {
    setCreating(true); setError("");
    try {
      await save();
      const r = await api<{ versionId: string }>(`/api/clinics/${id}/approve`, { json: { card } });
      onCreated(r.versionId);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setCreating(false);
    }
  }

  return (
    <div className="grid lg:grid-cols-[1.15fr_.85fr] gap-6">
      <section>
        <h1 className="text-[28px] font-semibold">Check the job card before Munshi creates your receptionist</h1>
        <p className="text-ink-2 mt-1">This is everything the receptionist will follow. Edit any line. Nothing is created until you approve.</p>
        <div className="card mt-5 divide-y divide-line">
          <Row label="Clinic name"><input className="field" value={card.clinicName} onChange={(e) => set("clinicName", e.target.value)} maxLength={80} /></Row>
          {INTERVIEW_FIELDS.map((f) =>
            f.key === "approvedPrices" ? (
              <Row key={f.key} label={f.label}><Prices value={card.approvedPrices} onChange={(v) => set("approvedPrices", v)} /></Row>
            ) : f.key === "languages" ? (
              <Row key={f.key} label={f.label}>
                <div className="flex gap-2">
                  {(["en", "hi"] as const).map((l) => {
                    const on = card.languages.includes(l);
                    return (
                      <button key={l} type="button" aria-pressed={on} className={`chip border ${on ? "border-teal bg-teal-soft text-teal" : "border-line text-ink-2"}`}
                        onClick={() => setCard((c) => ({ ...c, languages: on ? (c.languages.length > 1 ? c.languages.filter((x) => x !== l) : c.languages) : [...c.languages, l], answered: Array.from(new Set([...c.answered, "languages"])) }))}>
                        {l === "en" ? "English" : "Hindi · हिंदी"}
                      </button>
                    );
                  })}
                </div>
              </Row>
            ) : (
              <Row key={f.key} label={f.label} hint={f.key === "ifUnsure" ? "Optional. Leave it empty to see how Trial Day catches the gap." : undefined}>
                <textarea className="field min-h-[64px] resize-y" maxLength={400} value={String(card[f.key as keyof JobCard] ?? "")}
                  placeholder={f.key === "ifUnsure" ? "Not mentioned in the interview" : f.q} onChange={(e) => set(f.key as keyof JobCard, e.target.value as never)} />
              </Row>
            ),
          )}
          <Row label="Greeting" hint="Callers are always told they are speaking with an AI.">
            <input className="field" maxLength={240} value={card.greeting} placeholder={`Hello, this is the AI receptionist at ${card.clinicName}. How can I help?`} onChange={(e) => set("greeting", e.target.value)} />
          </Row>
        </div>
      </section>
      <aside className="lg:pt-[76px] space-y-4">
        <VoicePicker value={card.voiceId} onPick={(v) => setCard((c) => ({ ...c, voiceId: v.id, voiceName: v.name, voiceOwner: v.owner || "" }))} />
        <div className="card p-5">
          <h3 className="font-semibold">Create the receptionist</h3>
          <p className="text-[14px] text-ink-2 mt-1">Approving creates version 1 of your receptionist on ElevenLabs and the eight tests it must pass on Trial Day.</p>
          {error && <p className="text-[14px] text-fail mt-3" role="alert">{error}</p>}
          <div className="mt-4 flex gap-2">
            <button className="btn" disabled={saving || creating} onClick={() => save().catch(() => {})}>{saving && !creating ? "Saving…" : "Save draft"}</button>
            <button className="btn btn-primary flex-1" disabled={creating || card.clinicName.trim().length < 2} onClick={approve}>
              {creating ? "Creating receptionist and 8 tests…" : "Approve and create receptionist"}
            </button>
          </div>
          {creating && <p className="text-[13px] text-ink-3 mt-2">Creating booking tools, the agent and its tests. This takes about 20 seconds.</p>}
        </div>
      </aside>
    </div>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid sm:grid-cols-[150px_1fr] gap-2 sm:gap-4 px-5 py-3.5">
      <div className="text-[14px] text-ink-2 pt-2">{label}</div>
      <div>{children}{hint && <p className="text-[12.5px] text-wait mt-1">{hint}</p>}</div>
    </div>
  );
}

function Prices({ value, onChange }: { value: JobCard["approvedPrices"]; onChange: (v: JobCard["approvedPrices"]) => void }) {
  return (
    <div className="space-y-2">
      {value.map((p, i) => (
        <div key={i} className="flex gap-2">
          <input className="field" aria-label="Item" value={p.item} onChange={(e) => onChange(value.map((x, j) => (j === i ? { ...x, item: e.target.value } : x)))} />
          <input className="field w-[130px]" aria-label="Price" value={p.price} onChange={(e) => onChange(value.map((x, j) => (j === i ? { ...x, price: e.target.value } : x)))} />
          <button className="btn btn-ghost px-3" aria-label={`Remove ${p.item}`} onClick={() => onChange(value.filter((_, j) => j !== i))}>×</button>
        </div>
      ))}
      <button className="btn btn-ghost text-teal px-2" onClick={() => onChange([...value, { item: "", price: "₹" }])}>+ Add a price</button>
    </div>
  );
}

function VoicePicker({ value, onPick }: { value: string; onPick: (v: Voice) => void }) {
  const [voices, setVoices] = useState<Voice[] | null>(null);
  const [q, setQ] = useState("");
  const [playing, setPlaying] = useState("");
  const audio = useRef<HTMLAudioElement | null>(null);
  const [err, setErr] = useState("");

  async function load(search = "") {
    setErr("");
    try { const r = await api<{ voices: Voice[] }>(`/api/voices${search ? `?q=${encodeURIComponent(search)}` : ""}`); setVoices(r.voices); }
    catch (e) { setErr(e instanceof Error ? e.message : String(e)); setVoices([]); }
  }
  useEffect(() => { load(); }, []);

  function play(v: Voice) {
    audio.current?.pause();
    if (playing === v.id || !v.preview) { setPlaying(""); return; }
    audio.current = new Audio(v.preview);
    audio.current.onended = () => setPlaying("");
    audio.current.play().catch(() => setPlaying(""));
    setPlaying(v.id);
  }

  return (
    <div className="card p-5">
      <h3 className="font-semibold">Voice</h3>
      <p className="text-[13.5px] text-ink-2 mt-1">From the ElevenLabs voice library, filtered for calm conversational speech with an Indian accent. Play a preview before choosing.</p>
      <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); load(q); }}>
        <input className="field" placeholder="Search voices, e.g. warm, Hindi, female" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn">Search</button>
      </form>
      {err && <p className="text-[13px] text-fail mt-2">{err}</p>}
      <ul className="mt-3 max-h-[300px] overflow-y-auto space-y-1.5 pr-1">
        {!voices && <li className="text-[14px] text-ink-3">Loading voices…</li>}
        {voices?.map((v) => {
          const on = v.id === value;
          return (
            <li key={v.id} className={`flex items-center gap-2 rounded-[10px] border px-3 py-2 ${on ? "border-teal bg-teal-soft" : "border-line"}`}>
              <button className="btn btn-ghost w-9 h-9 px-0 shrink-0" aria-label={`${playing === v.id ? "Stop" : "Play"} ${v.name}`} onClick={() => play(v)} disabled={!v.preview}>
                {playing === v.id ? "■" : "▶"}
              </button>
              <button className="flex-1 text-left min-w-0" onClick={() => onPick(v)}>
                <p className="font-medium text-[14px] truncate">{v.name}</p>
                <p className="text-[12px] text-ink-3 truncate">{[v.labels.gender, v.labels.age, v.labels.accent, v.labels.useCase].filter(Boolean).join(" · ")}</p>
              </button>
              {on && <span className="badge-pass">Chosen</span>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
