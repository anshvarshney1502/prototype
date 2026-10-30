"use client";
import { useEffect } from "react";

// What actually happens underneath each step: the real ElevenLabs and Munshi calls.
const STEPS: Record<string, { title: string; lines: [string, string][] }> = {
  interview: { title: "Interview", lines: [
    ["ElevenLabs Agents (interviewer)", "useConversation({ clientTools }) from @elevenlabs/react, started with a short-lived signed URL from GET /v1/convai/conversation/get-signed-url"],
    ["Client tool update_job_card", "each answer is written to the job card through POST /api/clinics/:id/interview-field and validated with Zod"],
    ["Scribe v2 + Flash v2.5", "speech recognition and voice for Hindi, English and Hinglish"],
  ] },
  jobcard: { title: "Job card", lines: [
    ["Gemini", "a typed description becomes a draft job card (only facts you gave, never invented prices)"],
    ["Voice library", "GET /v1/shared-voices filtered for Indian-accent conversational voices, with previews"],
    ["Approve", "POST /v1/convai/tools (check_slots, book_slot, log_callback) → POST /v1/convai/agents/create → POST /v1/convai/agent-testing/create × 8"],
  ] },
  trial: { title: "Trial Day", lines: [
    ["Agent Testing", "POST /v1/convai/agents/:id/run-tests with repeat_count 3 on the exact version's branch"],
    ["Results", "GET /v1/convai/test-invocations/:id: next-reply, tool-call and simulation tests with transcripts and rationale"],
    ["Live test call", "talk to the candidate branch in the browser: transcript, per-reply latency, tool calls, interruptions"],
  ] },
  coach: { title: "Coach", lines: [
    ["Scribe v2", "\"Say it instead\" transcribes your spoken fix (POST /v1/speech-to-text)"],
    ["Gemini", "turns the sentence into one rule on the job card and a test condition"],
    ["Versions", "POST /v1/convai/agents/:id/branches + PATCH agent on that branch: version 1 stays untouched"],
    ["Permanent test", "the fix becomes a new Agent Testing test that runs on every future version"],
  ] },
  live: { title: "Go live", lines: [
    ["Gate", "only a version whose last run passed every blocker 3/3 can go live"],
    ["Versions", "POST /v1/convai/agents/:id/branches/:branch/merge into main; patients only reach main"],
    ["Deploy", "<elevenlabs-convai> web widget, a public talk link, and phone via ElevenLabs Twilio/SIP once a number is connected"],
  ] },
  calls: { title: "Calls", lines: [
    ["Post-call webhook", "POST /api/webhooks/elevenlabs, HMAC-verified, or a sync from GET /v1/convai/conversations"],
    ["Verified bookings", "every booking ID the agent says is checked against the Munshi calendar in MongoDB"],
    ["Gemini", "one-line summary, sentiment, outcome and a flag when you need to look"],
  ] },
};

export default function HowItWorks({ open, onClose, step }: { open: boolean; onClose: () => void; step: string }) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open, onClose]);
  if (!open) return null;
  const order = ["interview", "jobcard", "trial", "coach", "live", "calls"];
  return (
    <div className="fixed inset-0 z-40" role="dialog" aria-modal="true" aria-label="How this works">
      <button className="absolute inset-0 bg-ink/30" aria-label="Close" onClick={onClose} />
      <aside className="absolute right-0 top-0 h-full w-full max-w-[440px] bg-surface border-l border-line overflow-y-auto p-6 rise">
        <div className="flex items-center">
          <h2 className="text-[20px] font-semibold">How this works</h2>
          <button className="btn btn-ghost ml-auto" onClick={onClose}>Close</button>
        </div>
        <p className="text-[14px] text-ink-2 mt-1">ElevenLabs runs the voice, the agents and the tests. Munshi runs your workflow and keeps every key and booking on its own server.</p>
        {order.map((k) => (
          <section key={k} className={`mt-5 ${k === step ? "" : "opacity-70"}`}>
            <h3 className={`font-semibold ${k === step ? "text-teal" : ""}`}>{STEPS[k].title}</h3>
            <ul className="mt-2 space-y-2">
              {STEPS[k].lines.map(([a, b]) => (
                <li key={a} className="text-[13.5px]"><span className="font-medium">{a}</span><br /><span className="text-ink-2 font-mono text-[12px] break-words">{b}</span></li>
              ))}
            </ul>
          </section>
        ))}
      </aside>
    </div>
  );
}
