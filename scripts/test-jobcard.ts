// Run: npx tsx --conditions=react-server scripts/test-jobcard.ts
import assert from "node:assert/strict";
import { ZodError } from "zod";
import { JobCard, emptyCard, parsePrices, filledCount } from "../src/lib/jobcard";

const c = emptyCard("Test Clinic");
assert.deepEqual(c.languages, ["en", "hi"], "language default");
assert.equal(c.ifUnsure, "", "ifUnsure defaults empty");
assert.deepEqual(c.extraRules, [], "extraRules default");
assert.equal(c.useCase, "appointments");

assert.throws(() => JobCard.parse({ clinicName: "x" }), ZodError, "1-char name rejected");
assert.throws(() => JobCard.parse({ clinicName: "Ok Clinic", languages: [] }), ZodError, "empty languages rejected");
assert.throws(() => JobCard.parse({ clinicName: "Ok Clinic", languages: ["fr"] }), ZodError, "unknown language rejected");
assert.throws(() => JobCard.parse({ clinicName: "Ok Clinic", approvedPrices: Array.from({ length: 41 }, () => ({ item: "a", price: "₹1" })) }), ZodError, "41 prices rejected");
assert.throws(() => JobCard.parse({ clinicName: "Ok Clinic", never: "x".repeat(401) }), ZodError, "over-long field rejected");
try { JobCard.parse({ clinicName: "x" }); } catch (e) { assert.ok(Array.isArray((e as ZodError).issues) && (e as ZodError).issues[0].path[0] === "clinicName", "issues[].path available for API errors"); }

const p = parsePrices("scaling ₹1,200, filling ₹1,500; root canal from ₹6,000");
assert.deepEqual(p.map((x) => x.item), ["scaling", "filling", "root canal"]);
assert.deepEqual(p.map((x) => x.price), ["₹1,200", "₹1,500", "from ₹6,000"]);
assert.deepEqual(parsePrices("braces consultation ₹500"), [{ item: "braces consultation", price: "₹500" }]);
assert.deepEqual(parsePrices("implant ₹25,000,whitening ₹4,500").map((x) => x.price), ["₹25,000", "₹4,500"]);
assert.deepEqual(parsePrices("cleaning 800 rupees, x-ray rs 300").map((x) => x.price), ["800 rupees", "₹300"]);
assert.deepEqual(parsePrices("no prices here"), []);
assert.equal(filledCount(c), 0, "a blank card has 0 of 8 answered");
assert.equal(filledCount({ ...c, business: "x", mainJobs: "y" }), 2);
assert.equal(filledCount({ ...c, answered: ["languages"] }), 1, "languages counts only once answered");
console.log("jobcard: all assertions passed");
