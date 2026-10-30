import { route } from "@/lib/api";
import { cols, oid } from "@/lib/db";
import { syncCalls } from "@/lib/workflow";

export const maxDuration = 120;

// Call log. ?sync=1 pulls finished conversations from ElevenLabs (works even without a webhook configured).
export const GET = route<{ id: string }>(async (req, { id }) => {
  const _id = oid(id);
  if (new URL(req.url).searchParams.get("sync")) await syncCalls(_id);
  const { calls } = await cols();
  const list = await calls.find({ clinicId: _id }).sort({ startedAt: -1 }).limit(100).toArray();
  const n = list.length || 1;
  return {
    calls: list,
    metrics: {
      total: list.length,
      booked: list.filter((c) => c.outcome === "booked").length,
      needsYou: list.filter((c) => c.flagged).length,
      avgDuration: Math.round(list.reduce((s, c) => s + c.durationSecs, 0) / n),
      resolved: Math.round((100 * list.filter((c) => c.outcome !== "unresolved").length) / n),
      positive: Math.round((100 * list.filter((c) => c.sentiment === "positive").length) / n),
    },
  };
});
