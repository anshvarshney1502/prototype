import type { ObjectId } from "mongodb";
import type { JobCard } from "./jobcard";

export type Stage = "interview" | "jobcard" | "trial" | "coach" | "live";

export interface Clinic {
  _id: ObjectId;
  card: JobCard;
  stage: Stage;
  agentId?: string;            // one ElevenLabs agent per clinic; versions live on its branches
  mainBranchId?: string;
  toolIds?: { checkSlots: string; bookSlot: string; logCallback: string };
  liveVersionId?: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface Version {
  _id: ObjectId;
  clinicId: ObjectId;
  number: number;              // 1, 2, 3 … shown to the owner
  card: JobCard;               // frozen copy of the card this version was compiled from
  prompt: string;
  firstMessage: string;
  branchId: string;            // ElevenLabs branch (v1 = main)
  elVersionId: string;         // ElevenLabs immutable version id (agtvrsn_…)
  reason: string;              // "Created from the interview", "Coach: unknown price", "Refine: shorter greeting"
  status: "candidate" | "live" | "retired";
  lastRunId?: ObjectId;
  passedGate?: boolean;
  createdAt: Date;
}

export type TestKind = "llm" | "tool" | "simulation";

export interface TestDef {
  _id: ObjectId;
  clinicId: ObjectId;
  key: string;                 // approved_price, unknown_price, …, coach_<n>
  name: string;
  must: string;                // plain-language expected result shown to the owner
  severity: "blocker" | "high";
  kind: TestKind;
  method: string;              // "Next reply", "Tool call", "Simulation"
  elTestId: string;
  userLine: string;            // what the caller says, for the evidence panel
  fromCoach?: boolean;
  createdAt: Date;
}

export interface RunResult {
  testId: string;              // our TestDef id
  elTestId: string;
  passes: number;
  total: number;
  pending: number;
  runs: { status: "pending" | "passed" | "failed" | "cancelled"; transcript: { role: string; message: string }[]; rationale?: string }[];
}

export interface Run {
  _id: ObjectId;
  clinicId: ObjectId;
  versionId: ObjectId;
  invocationId: string;
  status: "running" | "done" | "error";
  results: RunResult[];
  passed: number;              // runs passed
  total: number;               // runs total (tests × 3)
  gate: boolean;               // every blocker 3/3
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Call {
  _id?: ObjectId;
  clinicId: ObjectId;
  conversationId: string;
  versionNumber?: number;
  startedAt: Date;
  durationSecs: number;
  transcript: { role: string; message: string; t: number }[];
  summary: string;
  outcome: "booked" | "callback" | "needs_you" | "answered" | "unresolved";
  sentiment: "positive" | "neutral" | "negative";
  language?: string;
  bookingIds: string[];
  bookingVerified: boolean;    // every booking the agent spoke about exists in our calendar
  flagged: boolean;
  flagReason?: string;
  source: "web" | "test" | "phone";
}

export interface Booking {
  _id?: ObjectId;
  clinicId: ObjectId;
  bookingId: string;           // bk_xxxx, the only proof of a booking
  start: Date;
  end: Date;
  patientName: string;
  phone: string;
  reason: string;
  status: "confirmed" | "cancelled";
  conversationId?: string;
  createdAt: Date;
}

export interface Callback {
  _id?: ObjectId;
  clinicId: ObjectId;
  name: string;
  phone: string;
  reason: string;
  urgent: boolean;
  conversationId?: string;
  createdAt: Date;
  done: boolean;
}

export interface Setting { _id: string; value: unknown }
