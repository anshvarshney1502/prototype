import Link from "next/link";
import Header from "@/components/Header";

export const metadata = { title: "Munshi · 90-second demo" };

export default function Demo() {
  return (
    <>
      <Header right={<Link className="btn btn-primary" href="/">Build a receptionist</Link>} />
      <main className="mx-auto max-w-[1200px] px-4 sm:px-6 py-8">
        <h1 className="text-[28px] font-semibold">Munshi in 90 seconds</h1>
        <p className="text-ink-2 mt-1 max-w-[720px]">Hire a voice receptionist by explaining the job, not by writing prompts. Watch it fail one test, take one spoken fix, and go live only after all 24 runs pass.</p>
        <div className="mt-5 rounded-[14px] overflow-hidden bg-black aspect-video shadow-[0_20px_60px_rgba(27,36,48,.14)]">
          <video className="w-full h-full" controls playsInline preload="metadata" poster="/demo/poster.jpg">
            <source src="/demo/munshi-explainer.mp4" type="video/mp4" />
          </video>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link className="btn btn-primary" href="/">Try it</Link>
          <a className="btn" href="/demo/munshi-explainer.mp4" download>Download MP4 (1080p)</a>
          <a className="btn btn-ghost" href="/prototype/index.html">Original clickable prototype</a>
        </div>
      </main>
    </>
  );
}
