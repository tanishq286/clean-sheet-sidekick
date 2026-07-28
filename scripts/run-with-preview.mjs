#!/usr/bin/env node
/**
 * Boots a preview server, runs the browser suites against it, and always tears
 * it down again.
 *
 * Both suites need a served build, which used to mean remembering to start
 * vite preview, remembering the IPv4 flag, and remembering to kill it after —
 * and a stale server silently serving an old build produced results that
 * looked real and weren't. This owns the whole lifecycle so `npm run
 * verify:full` is the only thing to remember.
 */
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PORT = Number(process.env.PORT ?? 4173);
const BASE = `http://127.0.0.1:${PORT}`;

// `--host 127.0.0.1` is required: the default binds :: and this container has
// no IPv6, so preview exits with EAFNOSUPPORT.
const server = spawn(
  "npx",
  ["vite", "preview", "--port", String(PORT), "--strictPort", "--host", "127.0.0.1"],
  { cwd: ROOT, stdio: "ignore", detached: false },
);

let serverExited = false;
server.on("exit", (code) => {
  serverExited = true;
  if (code) console.error(`preview server exited early with code ${code}`);
});

const stop = () => {
  if (!serverExited) server.kill("SIGTERM");
};
process.on("exit", stop);
process.on("SIGINT", () => {
  stop();
  process.exit(130);
});

async function waitForServer(timeoutMs = 30000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (serverExited) throw new Error("preview server exited before becoming ready");
    try {
      const res = await fetch(BASE, { signal: AbortSignal.timeout(2000) });
      if (res.ok) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(`preview server never became ready at ${BASE}`);
}

function run(script) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [join(ROOT, "scripts", script)], {
      cwd: ROOT,
      stdio: "inherit",
      env: { ...process.env, BASE },
    });
    child.on("exit", (code) => resolve(code ?? 1));
  });
}

try {
  await waitForServer();
  console.log(`preview ready at ${BASE}\n`);

  // Run every suite even if an earlier one fails — one full report beats
  // discovering the next problem on the next round trip.
  const codes = [];
  for (const script of ["smoke-routes.mjs", "smoke-authed.mjs", "sweep-templates.mjs"]) {
    codes.push(await run(script));
    console.log("");
  }

  stop();
  process.exit(codes.some(Boolean) ? 1 : 0);
} catch (err) {
  console.error(String(err));
  stop();
  process.exit(1);
}
