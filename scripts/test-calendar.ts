// Run: npx tsx --conditions=react-server scripts/test-calendar.ts
import assert from "node:assert/strict";
import { parseLocal, fmtLocal } from "../src/lib/calendar";

assert.equal(parseLocal("2026-02-31"), null, "Feb 31 must be rejected");
assert.equal(parseLocal("2026-13-05"), null, "month 13 must be rejected");
assert.equal(parseLocal("2026-11-05T25:00"), null, "hour 25 must be rejected");
assert.equal(parseLocal("2026-11-05T10:75"), null, "minute 75 must be rejected");
assert.equal(parseLocal("not a date"), null);
const d = parseLocal("2026-11-05T17:30");
assert.ok(d, "valid time parses");
assert.equal(fmtLocal(d!), "2026-11-05T17:30", "IST round trip");
assert.equal(d!.toISOString(), "2026-11-05T12:00:00.000Z", "17:30 IST is 12:00 UTC");
console.log("calendar: all assertions passed");
