/**
 * Parses src/services/apiRoute.js for throwApiError(err, "...") third args
 * and builds English strings map (fallback message → key inverted: key→en).
 */
import fs from "fs";
import { fileURLToPath } from "url";

/** Writes src/lib/apiErrors.en.generated.json — run after adding throwApiError keys */
const p = fileURLToPath(new URL("../src/services/apiRoute.js", import.meta.url));
const s = fs.readFileSync(p, "utf8");
const re =
  /throwApiError\(err,\s*"((?:[^"\\]|\\.)*)"\s*,\s*"((?:[^"\\]|\\.)*)"\)/g;

const pairs = [...s.matchAll(re)].map((m) => [m[2], m[1]]);
const en = {};
for (const [k, v] of pairs) en[k] = v;

const out = fileURLToPath(
  new URL("../src/lib/apiErrors.en.generated.json", import.meta.url),
);
fs.writeFileSync(out, JSON.stringify(en, null, 2) + "\n");
console.error("Wrote", out, "unique keys:", Object.keys(en).length);
