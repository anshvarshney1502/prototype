"use client";
import { useEffect, useRef, useState } from "react";
import { useLang, type Lang } from "@/lib/i18n";
import * as I from "@/components/Icons";

// The 60-second explainer exists in English and Hindi narration; switching keeps your place.
export default function Explainer() {
  const { lang } = useLang();
  const [track, setTrack] = useState<Lang>(lang);
  const video = useRef<HTMLVideoElement>(null);
  const resume = useRef<{ t: number; play: boolean } | null>(null);
  useEffect(() => setTrack(lang), [lang]);

  function pick(l: Lang) {
    const v = video.current;
    if (v) resume.current = { t: v.currentTime, play: !v.paused };
    setTrack(l);
  }

  return (
    <div>
      <div role="group" aria-label="Narration language" className="mb-3 inline-flex rounded-full bg-white/10 p-1">
        {(["en", "hi"] as const).map((l) => (
          <button key={l} type="button" aria-pressed={track === l} onClick={() => pick(l)}
            className={`inline-flex items-center gap-1.5 h-9 px-4 rounded-full text-[14px] font-medium cursor-pointer transition-colors ${track === l ? "bg-white text-ink" : "text-white/80 hover:text-white"}`}>
            <I.Volume className="w-4 h-4" /> {l === "en" ? "English" : "हिंदी"}
          </button>
        ))}
      </div>
      <div className="rounded-[18px] overflow-hidden bg-black aspect-video shadow-[0_30px_80px_-30px_rgba(0,0,0,.7)]">
        <video
          key={track}
          ref={video}
          className="w-full h-full"
          controls
          playsInline
          preload="metadata"
          poster="/explainer/poster.jpg"
          onLoadedMetadata={(e) => {
            const r = resume.current;
            if (!r) return;
            e.currentTarget.currentTime = r.t;
            if (r.play) e.currentTarget.play().catch(() => {});
            resume.current = null;
          }}
        >
          <source src={`/explainer/munshi-${track}.mp4`} type="video/mp4" />
        </video>
      </div>
    </div>
  );
}
