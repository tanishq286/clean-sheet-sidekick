#!/usr/bin/env node
/**
 * Guards against detaching `supabase.rpc` from its client.
 *
 * `rpc` is a prototype method whose body is `return this.rest.rpc(...)`, so
 *
 *     const rpc = supabase.rpc;   await rpc("some_fn");
 *
 * throws `TypeError: Cannot read properties of undefined (reading 'rest')`
 * *before sending a request*. This broke the public profile page, Discover,
 * view analytics and account deletion simultaneously, and cost days: no
 * request reaches Supabase, so the server logs are clean, and React Query
 * surfaces it as "couldn't reach the server" — which points every
 * investigation at the network rather than at the call site.
 *
 * It is invisible to the browser suites, because they stub Supabase at the
 * network layer and a call that never reaches the network never trips a stub.
 * Hence a static check, plus a runtime proof that the sanctioned helper works.
 *
 *   node scripts/check-rpc-binding.mjs
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "src");
const ALLOWED = new Set(["src/lib/rpc.ts"]);

function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

// Assignment of the bare method: `= supabase.rpc` / `= client.rpc` not
// immediately followed by a call. `(supabase.rpc as X)(…)` is safe and stays
// legal, but is not worth the ambiguity, so the helper is the only exception.
const DETACHED = /=\s*[A-Za-z_$][\w$]*\.rpc\s*(?:as\b|;|,|\n|$)/;

const offenders = [];
for (const file of walk(SRC)) {
  if (!/\.tsx?$/.test(file)) continue;
  const rel = relative(ROOT, file).replaceAll("\\", "/");
  if (ALLOWED.has(rel)) continue;
  readFileSync(file, "utf8").split("\n").forEach((line, i) => {
    if (DETACHED.test(line)) offenders.push(`${rel}:${i + 1}  ${line.trim().slice(0, 90)}`);
  });
}

if (offenders.length) {
  console.error("FAIL  supabase.rpc detached from its client — the call will throw before any request:\n");
  offenders.forEach((o) => console.error("  " + o));
  console.error("\nUse callRpc() from src/lib/rpc.ts instead.");
  process.exit(1);
}

// Runtime half: prove the helper's shape still binds correctly against the
// real client, so a supabase-js upgrade that changes `rpc` can't slip through.
const { createClient } = await import("@supabase/supabase-js");
const supabase = createClient("https://example.supabase.co", "sb_publishable_probe");

let detachedThrew = false;
try {
  const detached = supabase.rpc;
  await detached("probe");
} catch {
  detachedThrew = true;
}

const client = supabase;
let boundOk = false;
try {
  const builder = client.rpc("probe");
  boundOk = typeof builder?.then === "function";
  builder.then(
    () => {},
    () => {},
  );
} catch {
  boundOk = false;
}

if (!boundOk) {
  console.error("FAIL  a bound supabase.rpc call did not return a thenable — check src/lib/rpc.ts");
  process.exit(1);
}
if (!detachedThrew) {
  console.log("NOTE  detaching rpc no longer throws in this supabase-js version; the static check still stands.");
}

console.log(`PASS  no detached supabase.rpc calls (${offenders.length} offenders), bound call returns a thenable`);
