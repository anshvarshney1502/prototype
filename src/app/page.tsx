import Link from "next/link";
import Header from "@/components/Header";
import Builder from "@/components/Builder";
import Orb from "@/components/OrbLazy";
import Recent from "@/components/Recent";

const STEPS = [
  { n: 1, t: "Interview", d: "Explain the job out loud, like briefing a new hire." },
  { n: 2, t: "Job card", d: "Your answers become rules you can read and edit." },
  { n: 3, t: "Trial Day", d: "8 tricky calls, 3 runs each, before any patient calls." },
  { n: 4, t: "Coach", d: "Say what should have happened. It becomes a rule, a version and a test." },
  { n: 5, t: "Go live", d: "Unlocks only when every blocker passes 3 of 3." },
];

export default function Home() {
  return (
    <>
      <Header right={<><Link className="btn btn-ghost hidden sm:inline-flex" href="/demo">Watch the 90-second demo</Link></>} />
      <main className="mx-auto max-w-[1240px] px-4 sm:px-6">
        <section className="grid lg:grid-cols-[1.05fr_.95fr] gap-10 lg:gap-14 items-center pt-10 sm:pt-14 pb-12">
          <div className="rise">
            <p className="eyebrow">No-code voice receptionist · Built on ElevenLabs</p>
            <h1 className="mt-3 text-[40px] sm:text-[54px] leading-[1.04] font-semibold">
              Hire a voice receptionist by explaining the job.
            </h1>
            <p className="mt-4 text-[18px] text-ink-2 max-w-[560px]">
              Not by writing prompts. Munshi tests it on tricky calls, lets you fix mistakes in one sentence, and only goes live when every test passes.
            </p>
            <div className="mt-7"><Builder /></div>
          </div>
          <div className="relative hidden lg:block">
            <div className="aspect-square max-w-[520px] mx-auto"><Orb className="w-full h-full" /></div>
            <div className="absolute left-0 bottom-10 card px-4 py-3 shadow-[0_18px_40px_-24px_rgba(27,36,48,.35)] rise" style={{ animationDelay: ".2s" }}>
              <p className="text-[12.5px] font-semibold text-fail">Missed call · 9:42 pm</p>
              <p className="text-[16px] font-semibold mt-0.5">“Is Saturday 11 am free?”</p>
              <p className="text-[13.5px] text-ink-2">The patient asked. No one answered.</p>
            </div>
            <div className="absolute right-2 top-12 card px-4 py-3 shadow-[0_18px_40px_-24px_rgba(27,36,48,.35)] rise" style={{ animationDelay: ".35s" }}>
              <p className="text-[12.5px] text-ink-2">Trial Day · version 2</p>
              <p className="text-[22px] font-bold text-pass tabular-nums">24 / 24 runs passed</p>
            </div>
          </div>
        </section>

        <section className="pb-14" aria-labelledby="how">
          <h2 id="how" className="text-[22px] font-semibold">The loop is the product</h2>
          <ol className="mt-4 grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {STEPS.map((s) => (
              <li key={s.n} className={`card p-4 ${s.n === 3 ? "border-teal" : ""}`}>
                <span className={`grid place-items-center w-8 h-8 rounded-full text-[14px] font-bold ${s.n === 3 ? "bg-teal text-white" : "bg-sunk text-ink"}`}>{s.n}</span>
                <p className="mt-3 font-semibold text-[16px]">{s.t}</p>
                <p className="mt-1 text-[14px] text-ink-2 leading-snug">{s.d}</p>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-[13.5px] text-ink-3">ElevenLabs gives the voice, the agent runtime and the testing engine. Munshi is the owner’s workflow on top.</p>
        </section>

        <Recent />
      </main>
      <footer className="border-t border-line">
        <div className="mx-auto max-w-[1240px] px-4 sm:px-6 py-6 text-[13px] text-ink-3 flex flex-wrap gap-x-4 gap-y-1">
          <span>Team DOT DOT COM · Build Arena Hackathon</span>
          <span>Explain the job. Test the receptionist. Fix what goes wrong. Then let it answer.</span>
        </div>
      </footer>
    </>
  );
}
