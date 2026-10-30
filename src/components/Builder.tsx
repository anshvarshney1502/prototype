"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/client";
import { useLang, useT } from "@/lib/i18n";
import { BIZ_KEY, STARTERS } from "@/components/landing/content";
import * as I from "@/components/Icons";

const LIMIT = 1200;

// The whole start: speak (easiest) or type. Nothing technical to choose.
export default function Builder() {
  const t = useT();
  const { lang } = useLang();
  const router = useRouter();
  const [mode, setMode] = useState<"speak" | "type">("speak");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function go(kind: "speak" | "type") {
    setBusy(true); setError("");
    try {
      const r = await api<{ id: string }>("/api/clinics", { json: kind === "type" ? { description: text } : {} });
      router.push(`/c/${r.id}?step=${kind === "speak" ? "interview" : "jobcard"}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  }

  return (
    <div className="card p-5 sm:p-7 shadow-[0_24px_60px_-34px_rgba(27,36,48,.35)]">
      <h3 className="text-[19px] font-semibold text-center">{t("builderTitle")}</h3>
      <div className="mt-5 grid sm:grid-cols-2 gap-3" role="radiogroup">
        {([["speak", I.Mic, "builderSpeak", "builderSpeakD"], ["type", I.Keyboard, "builderType", "builderTypeD"]] as const).map(([m, Ic, a, b]) => (
          <button key={m} type="button" role="radio" aria-checked={mode === m} onClick={() => setMode(m)}
            className={`text-left rounded-[14px] border-2 p-4 flex gap-3 cursor-pointer transition-colors ${mode === m ? "border-teal bg-teal-soft/60" : "border-line hover:border-line-2"}`}>
            <span className={`grid place-items-center w-11 h-11 shrink-0 rounded-full ${mode === m ? "bg-teal text-white" : "bg-sunk text-ink-2"}`}><Ic className="w-5 h-5" /></span>
            <span><span className="block font-semibold text-[16px]">{t(a)}</span><span className="block text-[14px] text-ink-2 mt-0.5">{t(b)}</span></span>
          </button>
        ))}
      </div>

      {mode === "speak" ? (
        <button className="btn btn-primary btn-lg w-full mt-5" disabled={busy} onClick={() => go("speak")}>
          <I.Mic className="w-5 h-5" /> {busy ? t("builderOpening") : t("ivStart")}
        </button>
      ) : (
        <div className="mt-5">
          <label htmlFor="describe" className="sr-only">{t("builderType")}</label>
          <div className="relative">
            <textarea id="describe" className="field min-h-[140px] resize-y pb-7 leading-relaxed" maxLength={LIMIT} value={text}
              onChange={(e) => setText(e.target.value)} placeholder={t("builderPlaceholder")} />
            <span className="absolute right-3 bottom-2 text-[12px] text-ink-3 tabular-nums">{text.length}/{LIMIT}</span>
          </div>
          <p className="mt-3 text-[14px] text-ink-2">{t("builderPick")}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {STARTERS.map((s) => (
              <button key={s.biz} type="button" onClick={() => setText(s[lang])}
                className="chip h-9 px-3.5 border border-line bg-surface text-ink-2 hover:border-teal hover:text-teal cursor-pointer">{t(BIZ_KEY[s.biz])}</button>
            ))}
          </div>
          <button className="btn btn-primary btn-lg w-full mt-5" disabled={text.trim().length < 20 || busy} onClick={() => go("type")}>
            {busy ? t("builderCreating") : t("builderCreate")}
          </button>
        </div>
      )}
      {error && <p className="mt-3 text-[14px] text-fail text-center" role="alert">{error}</p>}
      <p className="mt-3 text-[13.5px] text-ink-3 text-center">{t("heroNote")}</p>
    </div>
  );
}
