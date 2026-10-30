"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { LangToggle, useLang, useT } from "@/lib/i18n";
import { api } from "@/lib/client";
import { Logo, LogoMark } from "@/components/Logo";
import Builder from "@/components/Builder";
import Explainer from "./Explainer";
import { BIZ_KEY, PHONE, PRACTICE, type Biz } from "./content";
import * as I from "@/components/Icons";

const BIZ_ICON: Record<Biz, (p: { className?: string }) => React.ReactElement> = {
  clinic: I.Tooth, salon: I.Scissors, restaurant: I.Utensils, realEstate: I.Building, coaching: I.Book, shop: I.Bag,
};

// Fade sections in as they scroll into view (instant when reduced motion is on, via CSS).
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && (e.target.classList.add("in"), io.unobserve(e.target))), { threshold: 0.12 });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

export default function Landing() {
  const t = useT();
  useReveal();
  return (
    <>
      <header className="sticky top-0 z-30 bg-bg/85 backdrop-blur border-b border-line/70">
        <div className="mx-auto max-w-[1180px] px-4 sm:px-6 h-16 flex items-center gap-3">
          <Link href="/" aria-label="Munshi home"><Logo /></Link>
          <nav className="ml-auto flex items-center gap-2 sm:gap-3">
            <LangToggle />
            <a href="#start" className="btn btn-primary hidden sm:inline-flex">{t("start")}</a>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-[1180px] px-4 sm:px-6 pt-10 sm:pt-16 pb-16 grid lg:grid-cols-[1.08fr_.92fr] gap-12 items-center">
          <div className="rise">
            <p className="inline-flex items-center gap-2 rounded-full bg-saffron-soft text-saffron-ink px-3 py-1 text-[13px] font-medium">
              <I.Store className="w-4 h-4" /> {t("heroEyebrow")}
            </p>
            <h1 className="font-display mt-5 text-[42px] sm:text-[60px] leading-[1.02] text-ink">{t("heroTitle")}</h1>
            <p className="mt-5 text-[18px] leading-relaxed text-ink-2 max-w-[560px]">{t("heroSub")}</p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <a href="#start" className="btn btn-primary btn-lg">{t("heroCta")} <I.Arrow className="w-4 h-4" /></a>
              <a href="#watch" className="btn btn-lg"><span className="grid place-items-center w-6 h-6 rounded-full bg-saffron text-white"><I.Play className="w-3 h-3" /></span>{t("heroWatch")}</a>
            </div>
            <p className="mt-3 text-[14px] text-ink-3">{t("heroNote")}</p>
          </div>
          <PhoneDemo />
        </section>

        {/* Video */}
        <section id="watch" className="scroll-mt-20 bg-ink text-white">
          <div className="mx-auto max-w-[1180px] px-4 sm:px-6 py-16 sm:py-20 reveal">
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[260px]">
                <h2 className="font-display text-[34px] sm:text-[42px] leading-tight">{t("videoTitle")}</h2>
                <p className="mt-2 text-white/70 text-[17px]">{t("videoSub")}</p>
              </div>
            </div>
            <div className="mt-8"><Explainer /></div>
          </div>
        </section>

        {/* How */}
        <section className="mx-auto max-w-[1180px] px-4 sm:px-6 py-20">
          <h2 className="font-display text-[34px] sm:text-[42px] leading-tight max-w-[640px] reveal">{t("howTitle")}</h2>
          <ol className="mt-10 grid md:grid-cols-3 gap-5">
            {([["how1", "how1d", I.Mic], ["how2", "how2d", I.Shield], ["how3", "how3d", I.Flag]] as const).map(([a, b, Ic], i) => (
              <li key={a} className="card p-6 reveal" style={{ transitionDelay: `${i * 90}ms` }}>
                <div className="flex items-center gap-3">
                  <span className="grid place-items-center w-10 h-10 rounded-full bg-teal-soft text-teal"><Ic className="w-5 h-5" /></span>
                  <span className="font-display text-[22px] text-saffron">0{i + 1}</span>
                </div>
                <h3 className="mt-4 text-[20px] font-semibold">{t(a)}</h3>
                <p className="mt-2 text-ink-2 leading-relaxed">{t(b)}</p>
              </li>
            ))}
          </ol>
        </section>

        <Practice />

        {/* Who + trust */}
        <section className="mx-auto max-w-[1180px] px-4 sm:px-6 py-20">
          <h2 className="font-display text-[30px] sm:text-[36px] reveal">{t("whoTitle")}</h2>
          <ul className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 reveal">
            {(Object.keys(BIZ_KEY) as Biz[]).map((b) => {
              const Ic = BIZ_ICON[b];
              return (
                <li key={b} className="card px-4 py-5 flex flex-col items-center gap-2 text-center">
                  <Ic className="w-7 h-7 text-teal" /><span className="font-medium">{t(BIZ_KEY[b])}</span>
                </li>
              );
            })}
          </ul>
          <h2 className="font-display text-[30px] sm:text-[36px] mt-20 reveal">{t("trustTitle")}</h2>
          <ul className="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {([["trust1", "trust1d", I.Bot], ["trust2", "trust2d", I.Calendar], ["trust3", "trust3d", I.Languages], ["trust4", "trust4d", I.Shield]] as const).map(([a, b, Ic], i) => (
              <li key={a} className="card p-5 reveal" style={{ transitionDelay: `${i * 80}ms` }}>
                <Ic className="w-6 h-6 text-saffron" />
                <h3 className="mt-3 font-semibold text-[17px]">{t(a)}</h3>
                <p className="mt-1 text-[15px] text-ink-2">{t(b)}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* Start */}
        <section id="start" className="scroll-mt-20 bg-teal-soft/60 border-y border-line">
          <div className="mx-auto max-w-[860px] px-4 sm:px-6 py-16 sm:py-20">
            <h2 className="font-display text-[32px] sm:text-[42px] leading-tight text-center reveal">{t("finalTitle")}</h2>
            <div className="mt-8 reveal"><Builder /></div>
            <Mine />
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-[1180px] px-4 sm:px-6 py-8 flex flex-wrap items-center gap-3 text-[14px] text-ink-3">
        <LogoMark size={22} /> <span>{t("footer")}</span>
      </footer>
    </>
  );
}

// A phone that plays a real-looking call, cycling through businesses, in the chosen language.
function PhoneDemo() {
  const { lang } = useLang();
  const t = useT();
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(1);
  const convo = PHONE[i];
  const lines = convo[lang];
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => { setShown(1); }, [i, lang]);
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { setShown(lines.length); return; }
    const id = setTimeout(() => {
      if (shown < lines.length) setShown(shown + 1);
      else { setI((i + 1) % PHONE.length); }
    }, shown < lines.length ? 1500 : 3200);
    return () => clearTimeout(id);
  }, [shown, lines.length, i]);
  useEffect(() => { box.current?.scrollTo({ top: box.current.scrollHeight, behavior: "smooth" }); }, [shown]);

  return (
    <div className="relative mx-auto w-full max-w-[380px] rise" style={{ animationDelay: ".15s" }}>
      <div className="absolute -inset-6 -z-10 rounded-[48px] bg-saffron-soft/70 rotate-[-3deg]" aria-hidden />
      <div className="rounded-[36px] border-[10px] border-ink bg-surface shadow-[0_30px_60px_-30px_rgba(27,36,48,.5)] overflow-hidden">
        <div className="px-5 pt-4 pb-3 border-b border-line flex items-center gap-3">
          <span className="relative grid place-items-center w-10 h-10 rounded-full bg-teal text-white"><I.Phone className="w-5 h-5" />
            <span className="absolute -right-0.5 -top-0.5 w-3 h-3 rounded-full bg-pass border-2 border-surface" /></span>
          <div className="min-w-0">
            <p className="font-semibold truncate">{convo.name[lang]}</p>
            <p className="text-[12.5px] text-pass font-medium">● {t("mockLive")} · {t("mockAnswered")}</p>
          </div>
        </div>
        <div ref={box} className="h-[380px] overflow-hidden px-4 py-4 space-y-2.5 bg-bg/60" aria-live="off">
          {lines.slice(0, shown).map((l, k) =>
            l.who === "action" ? (
              <div key={`${i}-${k}`} className="flex justify-center bubble-in">
                <span className="badge-pass"><I.Check className="w-3.5 h-3.5" /> {l.text}</span>
              </div>
            ) : (
              <div key={`${i}-${k}`} className={`flex bubble-in ${l.who === "caller" ? "justify-end" : ""}`}>
                <p className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-[14.5px] leading-snug ${l.who === "caller" ? "bg-ink text-white rounded-br-md" : "bg-surface border border-line rounded-bl-md"}`}>{l.text}</p>
              </div>
            ),
          )}
        </div>
        <div className="flex justify-center gap-1.5 py-3" role="tablist" aria-label="Examples">
          {PHONE.map((p, k) => (
            <button key={p.biz} role="tab" aria-selected={k === i} aria-label={p.name[lang]} onClick={() => setI(k)}
              className={`h-2 rounded-full transition-all cursor-pointer ${k === i ? "w-6 bg-teal" : "w-2 bg-line-2"}`} />
          ))}
        </div>
      </div>
    </div>
  );
}

// Pick a business, see a mistake caught in practice and fixed with one sentence.
function Practice() {
  const { lang } = useLang();
  const t = useT();
  const [b, setB] = useState(0);
  const [step, setStep] = useState(0); // 0 question+bad, 1 fix, 2 good
  const ex = PRACTICE[b][lang];
  useEffect(() => { setStep(0); }, [b, lang]);
  useEffect(() => {
    if (step >= 2) return;
    const id = setTimeout(() => setStep((s) => s + 1), step === 0 ? 2200 : 1800);
    return () => clearTimeout(id);
  }, [step]);

  return (
    <section className="bg-surface border-y border-line">
      <div className="mx-auto max-w-[1180px] px-4 sm:px-6 py-20 grid lg:grid-cols-[.85fr_1.15fr] gap-10 items-start">
        <div className="reveal">
          <h2 className="font-display text-[34px] sm:text-[42px] leading-tight">{t("practiceTitle")}</h2>
          <p className="mt-3 text-[17px] text-ink-2">{t("practiceSub")}</p>
          <div className="mt-6 flex flex-wrap gap-2" role="tablist">
            {PRACTICE.map((p, k) => {
              const Ic = BIZ_ICON[p.biz];
              return (
                <button key={p.biz} role="tab" aria-selected={k === b} onClick={() => setB(k)}
                  className={`inline-flex items-center gap-2 h-11 px-4 rounded-full border text-[15px] font-medium cursor-pointer transition-colors ${k === b ? "border-teal bg-teal text-white" : "border-line bg-bg text-ink-2 hover:border-teal hover:text-teal"}`}>
                  <Ic className="w-4 h-4" /> {t(BIZ_KEY[p.biz])}
                </button>
              );
            })}
          </div>
        </div>
        <div className="card p-5 sm:p-6 bg-bg reveal" aria-live="polite">
          <p className="text-[12.5px] font-semibold text-ink-3 uppercase tracking-wider">{t("practiceCaller")}</p>
          <p className="mt-1 text-[18px] font-medium">“{ex.q}”</p>

          <div className="mt-5 rounded-[14px] border border-fail/30 bg-fail-soft p-4 bubble-in" key={`bad-${b}-${lang}`}>
            <p className="flex items-center gap-1.5 text-[13px] font-semibold text-fail"><I.X className="w-4 h-4" /> {t("practiceBefore")}</p>
            <p className="mt-1 text-[16px]">{ex.bad}</p>
          </div>

          <div className={`mt-3 rounded-[14px] border border-saffron/40 bg-saffron-soft p-4 transition-opacity duration-500 ${step >= 1 ? "opacity-100" : "opacity-0"}`}>
            <p className="flex items-center gap-1.5 text-[13px] font-semibold text-saffron-ink"><I.Mic className="w-4 h-4" /> {t("practiceFix")}</p>
            <p className="mt-1 text-[16px] italic">“{ex.fix}”</p>
          </div>

          <div className={`mt-3 rounded-[14px] border border-pass/30 bg-pass-soft p-4 transition-opacity duration-500 ${step >= 2 ? "opacity-100" : "opacity-0"}`}>
            <p className="flex items-center gap-1.5 text-[13px] font-semibold text-pass"><I.Check className="w-4 h-4" /> {t("practiceAfter")}</p>
            <p className="mt-1 text-[16px]">{ex.good}</p>
          </div>
          <p className={`mt-4 text-[14px] text-ink-2 flex items-center gap-2 transition-opacity duration-500 ${step >= 2 ? "opacity-100" : "opacity-0"}`}>
            <I.Shield className="w-4 h-4 text-teal" /> {t("practiceCaught")}
          </p>
        </div>
      </div>
    </section>
  );
}

function Mine() {
  const t = useT();
  const [list, setList] = useState<{ id: string; name: string; stage: string }[]>([]);
  useEffect(() => { api<{ id: string; name: string; stage: string }[]>("/api/clinics").then(setList).catch(() => {}); }, []);
  if (!list.length) return null;
  return (
    <div className="mt-10">
      <h3 className="font-semibold">{t("yourReceptionists")}</h3>
      <ul className="mt-3 grid sm:grid-cols-2 gap-3">
        {list.map((c) => (
          <li key={c.id}>
            <Link href={`/c/${c.id}`} className="card p-4 flex items-center gap-3 hover:border-teal transition-colors">
              <LogoMark size={22} /><span className="font-medium truncate">{c.name}</span>
              <span className={`ml-auto ${c.stage === "live" ? "badge-pass" : "badge-muted"}`}>{c.stage === "live" ? t("live") : t(c.stage === "interview" ? "stepExplain" : c.stage === "jobcard" ? "stepCard" : "stepTest")}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
