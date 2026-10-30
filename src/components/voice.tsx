"use client";
import { ConversationProvider, useConversation, type ClientTools } from "@elevenlabs/react";
import { useCallback, useRef, useState } from "react";

export type Line = { role: "user" | "agent" | "tool"; text: string; latencyMs?: number; error?: boolean; at: number };

export function VoiceProvider({ children }: { children: React.ReactNode }) {
  return <ConversationProvider>{children}</ConversationProvider>;
}

// Live voice session with transcript, per-reply latency and tool-call visibility.
// Interruptions are handled by ElevenLabs turn-taking: talking over the agent cuts it off.
export function useVoiceSession(clientTools?: ClientTools) {
  const [lines, setLines] = useState<Line[]>([]);
  const [error, setError] = useState("");
  const lastUserAt = useRef<number | null>(null);
  const pendingLatency = useRef<number | undefined>(undefined);

  const conv = useConversation({
    clientTools,
    onMessage: (m) => {
      const role = m.role === "agent" ? "agent" : "user";
      if (role === "user") lastUserAt.current = performance.now();
      const latencyMs = role === "agent" ? pendingLatency.current : undefined;
      if (role === "agent") pendingLatency.current = undefined;
      setLines((l) => [...l, { role, text: m.message, latencyMs, at: Date.now() }]);
    },
    onModeChange: ({ mode }) => {
      if (mode === "speaking" && lastUserAt.current != null) {
        pendingLatency.current = Math.round(performance.now() - lastUserAt.current);
        lastUserAt.current = null;
      }
    },
    onAgentToolResponse: (t) => {
      const result = "full_tool_result" in t ? ` → ${String(t.full_tool_result).slice(0, 160)}` : "";
      setLines((l) => [...l, { role: "tool", text: `${t.tool_name}${result}`, error: t.is_error, at: Date.now() }]);
    },
    onError: (msg) => setError(typeof msg === "string" ? msg : "Voice connection error"),
    onDisconnect: () => { lastUserAt.current = null; },
  });

  const start = useCallback(async (signedUrl: string) => {
    setError("");
    setLines([]);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError("Microphone access was blocked. Allow the microphone in your browser and try again.");
      return false;
    }
    conv.startSession({ signedUrl, connectionType: "websocket" });
    return true;
  }, [conv]);

  // 0..1 level for the orb: agent output while speaking, owner input while listening.
  const getLevel = useCallback(() => {
    if (conv.status !== "connected") return 0;
    try { return Math.min(1, (conv.isSpeaking ? conv.getOutputVolume() : conv.getInputVolume()) * 2.2); } catch { return 0; }
  }, [conv]);

  const latencies = lines.filter((l) => l.latencyMs != null).map((l) => l.latencyMs!);
  const avgLatency = latencies.length ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : null;

  return { ...conv, lines, error, start, getLevel, avgLatency };
}
