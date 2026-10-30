import "server-only";
import { MongoClient, type Db, ObjectId } from "mongodb";
import { env } from "./env";
import type { Clinic, Version, TestDef, Run, Call, Booking, Callback, Setting } from "./types";

// One client per server process; Next dev hot-reload would otherwise open a new pool per edit.
const g = globalThis as unknown as { _mongo?: Promise<MongoClient>; _indexed?: boolean };

async function client() {
  // A failed connect is not cached, so fixing the URI doesn't need a server restart.
  if (!g._mongo) g._mongo = new MongoClient(env.mongoUri, { maxPoolSize: 10 }).connect().catch((e) => { g._mongo = undefined; throw e; });
  return g._mongo;
}

export async function db(): Promise<Db> {
  const d = (await client()).db(env.mongoDb);
  if (!g._indexed) {
    g._indexed = true;
    await Promise.all([
      d.collection("versions").createIndex({ clinicId: 1, number: 1 }, { unique: true }),
      d.collection("tests").createIndex({ clinicId: 1 }),
      d.collection("runs").createIndex({ versionId: 1, createdAt: -1 }),
      d.collection("calls").createIndex({ conversationId: 1 }, { unique: true }),
      d.collection("calls").createIndex({ clinicId: 1, startedAt: -1 }),
      // A slot can only be booked once per clinic: the database enforces "no double booking".
      d.collection("bookings").createIndex({ clinicId: 1, start: 1 }, { unique: true, partialFilterExpression: { status: "confirmed" } }),
      d.collection("bookings").createIndex({ bookingId: 1 }, { unique: true }),
    ]);
  }
  return d;
}

export async function cols() {
  const d = await db();
  return {
    clinics: d.collection<Clinic>("clinics"),
    versions: d.collection<Version>("versions"),
    tests: d.collection<TestDef>("tests"),
    runs: d.collection<Run>("runs"),
    calls: d.collection<Call>("calls"),
    bookings: d.collection<Booking>("bookings"),
    callbacks: d.collection<Callback>("callbacks"),
    settings: d.collection<Setting>("settings"),
  };
}

export function oid(id: string) {
  if (!ObjectId.isValid(id)) throw new HttpError(404, "Not found");
  return new ObjectId(id);
}

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
