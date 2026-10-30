import "server-only";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { HttpError } from "./db";

type Ctx<P> = { params: Promise<P> };

// Every route returns JSON and turns failures into a readable message for the owner.
export function route<P = Record<string, string>>(fn: (req: Request, p: P) => Promise<unknown>) {
  return async (req: Request, ctx: Ctx<P>) => {
    try {
      const out = await fn(req, await ctx.params);
      return out instanceof Response ? out : NextResponse.json(out ?? { ok: true });
    } catch (e) {
      if (e instanceof HttpError) return NextResponse.json({ error: e.message }, { status: e.status });
      if (e instanceof ZodError) return NextResponse.json({ error: "Some fields are invalid: " + e.issues.map((i) => i.path.join(".")).join(", ") }, { status: 400 });
      const msg = e instanceof Error ? e.message : String(e);
      // ElevenLabs SDK errors carry the API's own explanation in body.detail
      const detail = (e as { body?: { detail?: unknown } })?.body?.detail;
      console.error("[api]", msg, detail ?? "");
      return NextResponse.json({ error: detail ? `${msg}: ${typeof detail === "string" ? detail : JSON.stringify(detail).slice(0, 400)}` : msg }, { status: 500 });
    }
  };
}

export async function body<T = Record<string, unknown>>(req: Request): Promise<T> {
  try { return (await req.json()) as T; } catch { throw new HttpError(400, "Expected a JSON body."); }
}

export const str = (v: unknown, max = 2000) => {
  if (typeof v !== "string" || !v.trim()) throw new HttpError(400, "Missing text.");
  return v.trim().slice(0, max);
};
