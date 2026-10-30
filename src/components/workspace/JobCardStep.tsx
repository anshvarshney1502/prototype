"use client";
import { useEffect, useRef, useState } from "react";
import { api, type Workspace } from "@/lib/client";
import { INTERVIEW_FIELDS, type JobCard } from "@/lib/jobcard";
import { useT } from "@/lib/i18n";
import * as I from "@/components/Icons";
import CardView, { FIELD_LABEL } from "./CardView";

type Voice = { id: string; owner?: string; name: string; preview: string; labels: Record<string, string>; description: string };

export default function JobCardStep({ id, data, reload, onCreated }: { id: string; data: Workspace; reload: () => Promise<unknown>; onCreated: (versionId: string) => void }) {
  const t = useT();
  const created = !!data.clinic.agentId;
  const [card, setCard] = useState<JobCard>(data.clinic.card);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => setCard(data.clinic.card), [data.clinic.card]);

  if (created) {
    return (
      <div className="grid lg:grid-cols-[1fr_.75fr] gap-6">
        <div>
          <h1 className="font-display text-[30px] sm:text-[36px] leading-tight">{t("cardLockedTitle")}</h1>
          <p className="text-ink-2 mt-2">{t("cardLockedSub")}</p>
          <div className="mt-6"><CardView card={data.versions[data.versions.length - 1]?.card ?? card} /></div>
        </div>
        <aside className="lg:pt-[92px]">
          <div className="card p-5">
            <h3 className="font-semibold">{t("versions")}</h3>
            <ul className="mt-3 space-y-2.5">
              {data.versions.map((v) => (
                <li key={v._id} className="flex items-start gap-3 text-[14.5px]">
                  <span className="badge-muted tabular-nums">{t("version", { n: v.number })}</span>
                  <span className="flex-1 text-ink-2">{plainReason(v.reason)}</span>
                  {v.status === "live" ? <span className="badge-pass">{t("live")}</span> : v.passedGate ? <span className="badge-pass">{t("passed")}</span> : null}
                </li>
              ))}
            </ul>
            {!data.versions.some((v) => v.status === "live") && <p className="text-[13.5px] text-ink-3 mt-3">{t("nothingLive")}</p>}
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
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); setCreating(false); }
  }

  return (
    <div className="grid lg:grid-cols-[1.15fr_.85fr] gap-6">
      <section>
        <h1 className="font-display text-[30px] sm:text-[36px] leading-tight">{t("cardTitle")}</h1>
        <p className="text-ink-2 mt-2">{t("cardSub")}</p>
        <div className="card mt-6 divide-y divide-line">
          <Row label={t("fName")}><input className="field" value={card.clinicName} onChange={(e) => set("clinicName", e.target.value)} maxLength={80} /></Row>
          {INTERVIEW_FIELDS.map((f) =>
            f.key === "approvedPrices" ? (
              <Row key={f.key} label={t("fPrices")}><Prices value={card.approvedPrices} onChange={(v) => set("approvedPrices", v)} /></Row>
            ) : f.key === "languages" ? (
              <Row key={f.key} label={t("fLanguages")}>
                <div className="flex gap-2">
                  {(["en", "hi"] as const).map((l) => {
                    const on = card.languages.includes(l);
                    return (
                      <button key={l} type="button" aria-pressed={on}
                        className={`chip h-10 px-4 border cursor-pointer ${on ? "border-teal bg-teal-soft text-teal" : "border-line text-ink-2"}`}
                        onClick={() => setCard((c) => ({ ...c, languages: on ? (c.languages.length > 1 ? c.languages.filter((x) => x !== l) : c.languages) : [...c.languages, l], answered: Array.from(new Set([...c.answered, "languages"])) }))}>
                        {on && <I.Check className="w-4 h-4" />}{l === "en" ? "English" : "हिंदी"}
                      </button>
                    );
                  })}
                </div>
              </Row>
            ) : (
              <Row key={f.key} label={t(FIELD_LABEL[f.key])} hint={f.key === "ifUnsure" ? t("ifUnsureHint") : undefined}>
                <textarea className="field min-h-[64px] resize-y" maxLength={400} value={String(card[f.key as keyof JobCard] ?? "")}
                  onChange={(e) => set(f.key as keyof JobCard, e.target.value as never)} />
              </Row>
            ),
          )}
          <Row label={t("fGreeting")} hint={t("greetingHint")}>
            <input className="field" maxLength={240} value={card.greeting} placeholder={`Hello, this is the AI receptionist at ${card.clinicName}. How can I help?`} onChange={(e) => set("greeting", e.target.value)} />
          </Row>
        </div>
      </section>
      <aside className="lg:pt-[92px] space-y-4">
        <VoicePicker value={card.voiceId} onPick={(v) => setCard((c) => ({ ...c, voiceId: v.id, voiceName: v.name, voiceOwner: v.owner || "" }))} />
        <div className="card p-5 lg:sticky lg:top-32">
          <p className="text-[14.5px] text-ink-2">{t("createSub")}</p>
          {error && <p className="text-[14px] text-fail mt-3" role="alert">{error}</p>}
          <button className="btn btn-primary btn-lg w-full mt-4" disabled={creating || card.clinicName.trim().length < 2} onClick={approve}>
            {creating ? t("creating") : <>{t("create")} <I.Arrow className="w-4 h-4" /></>}
          </button>
          {creating ? <p className="text-[13px] text-ink-3 mt-2 text-center">{t("creatingNote")}</p>
            : <button className="btn btn-ghost w-full mt-2" disabled={saving} onClick={() => save().catch(() => {})}>{saving ? t("saving") : t("saveDraft")}</button>}
        </div>
      </aside>
    </div>
  );
}

// Version reasons are stored in English ("Coach: …", "Refine: …"); show the human part only.
function plainReason(r: string) {
  return r.replace(/^Coach: [^·]*·\s*/, "").replace(/^Refine:\s*/, "").replace("Created from the interview", "First version");
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid sm:grid-cols-[160px_1fr] gap-2 sm:gap-4 px-5 py-4">
      <div className="text-[14.5px] text-ink-2 sm:pt-2.5 font-medium">{label}</div>
      <div>{children}{hint && <p className="text-[13px] text-wait mt-1.5">{hint}</p>}</div>
    </div>
  );
}

function Prices({ value, onChange }: { value: JobCard["approvedPrices"]; onChange: (v: JobCard["approvedPrices"]) => void }) {
  const t = useT();
  return (
    <div className="space-y-2">
      {value.map((p, i) => (
        <div key={i} className="flex gap-2">
          <input className="field" aria-label={t("item")} value={p.item} onChange={(e) => onChange(value.map((x, j) => (j === i ? { ...x, item: e.target.value } : x)))} />
          <input className="field w-[130px]" aria-label={t("price")} value={p.price} onChange={(e) => onChange(value.map((x, j) => (j === i ? { ...x, price: e.target.value } : x)))} />
          <button className="btn btn-ghost w-11 px-0 shrink-0" aria-label={`${t("remove")} ${p.item}`} onClick={() => onChange(value.filter((_, j) => j !== i))}><I.X className="w-4 h-4" /></button>
        </div>
      ))}
      <button className="btn btn-ghost text-teal px-2" onClick={() => onChange([...value, { item: "", price: "₹" }])}>{t("addPrice")}</button>
    </div>
  );
}

function VoicePicker({ value, onPick }: { value: string; onPick: (v: Voice) => void }) {
  const t = useT();
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
  useEffect(() => () => audio.current?.pause(), []);
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
      <h3 className="font-semibold">{t("voice")}</h3>
      <p className="text-[14px] text-ink-2 mt-1">{t("voiceSub")}</p>
      <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); load(q); }}>
        <input className="field" placeholder={t("voiceSearch")} value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn">{t("search")}</button>
      </form>
      {err && <p className="text-[13px] text-fail mt-2">{err}</p>}
      <ul className="mt-3 max-h-[300px] overflow-y-auto space-y-1.5 pr-1">
        {!voices && <li className="text-[14px] text-ink-3">{t("voicesLoading")}</li>}
        {voices?.map((v) => {
          const on = v.id === value;
          return (
            <li key={v.id} className={`flex items-center gap-2 rounded-[12px] border px-2 py-1.5 ${on ? "border-teal bg-teal-soft" : "border-line"}`}>
              <button className="grid place-items-center w-10 h-10 rounded-full hover:bg-sunk cursor-pointer shrink-0" aria-label={`${v.name}`} onClick={() => play(v)} disabled={!v.preview}>
                {playing === v.id ? <span className="w-3 h-3 rounded-[2px] bg-ink" /> : <I.Play className="w-4 h-4 text-teal" />}
              </button>
              <button className="flex-1 text-left min-w-0 cursor-pointer py-1" onClick={() => onPick(v)}>
                <p className="font-medium text-[14.5px] truncate">{v.name.split(" - ")[0]}</p>
                <p className="text-[12.5px] text-ink-3 truncate capitalize">{[v.labels.gender, v.labels.age].filter(Boolean).join(" · ")}</p>
              </button>
              {on && <span className="badge-pass">{t("chosen")}</span>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

