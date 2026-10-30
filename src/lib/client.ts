"use client";
import type { JobCard } from "./jobcard";

// Browser-side helpers. Shapes mirror the API's JSON (ObjectIds arrive as strings).
export async function api<T = unknown>(path: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const res = await fetch(path, {
    ...init,
    method: init?.method ?? (init?.json !== undefined ? "POST" : "GET"),
    headers: init?.json !== undefined ? { "content-type": "application/json", ...(init?.headers || {}) } : init?.headers,
    body: init?.json !== undefined ? JSON.stringify(init.json) : init?.body,
    cache: "no-store",
    signal: init?.signal ?? AbortSignal.timeout(110_000),
  }).catch((e: unknown) => {
    if (e instanceof DOMException && (e.name === "TimeoutError" || e.name === "AbortError")) throw new Error("This is taking too long. Check your connection and try again.");
    throw e;
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || `Request failed (${res.status})`);
  return data as T;
}

export type Id = string;
export interface ClinicJ { _id: Id; card: JobCard; stage: "interview" | "jobcard" | "trial" | "coach" | "live"; agentId?: string; liveVersionId?: Id; mainBranchId?: string }
export interface VersionJ { _id: Id; number: number; card: JobCard; prompt: string; firstMessage: string; branchId: string; elVersionId: string; reason: string; status: "candidate" | "live" | "retired"; lastRunId?: Id; passedGate?: boolean; createdAt: string }
export interface TestJ { _id: Id; key: string; name: string; must: string; severity: "blocker" | "high"; kind: string; method: string; userLine: string; fromCoach?: boolean }
export interface RunResultJ { testId: Id; passes: number; total: number; pending: number; runs: { status: string; transcript: { role: string; message: string }[]; rationale?: string }[] }
export interface RunJ { _id: Id; versionId: Id; status: "running" | "done" | "error"; results: RunResultJ[]; passed: number; total: number; gate: boolean; createdAt: string; error?: string }
export interface BookingJ { _id: Id; bookingId: string; start: string; patientName: string; phone: string; reason: string }
export interface CallbackJ { _id: Id; name: string; phone: string; reason: string; urgent: boolean; createdAt: string }
export interface Workspace { clinic: ClinicJ; versions: VersionJ[]; tests: TestJ[]; runs: RunJ[]; bookings: BookingJ[]; callbacks: CallbackJ[] }
export interface CallJ { _id: Id; conversationId: string; versionNumber?: number; startedAt: string; durationSecs: number; transcript: { role: string; message: string; t: number }[]; summary: string; outcome: string; sentiment: string; bookingIds: string[]; bookingVerified: boolean; flagged: boolean; flagReason?: string }

export const fmtTime = (iso: string) => new Date(iso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
