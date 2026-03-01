/**
 * Owner Verification: "Does auth protect my system?"
 *
 * Usage: npx tsx scripts/auth-check.ts
 *
 * Tests three scenarios:
 * 1. Valid token → authenticated (200-equivalent)
 * 2. Bad token → rejected (401)
 * 3. No token → rejected (401)
 */

import { resolveAuthToken } from "../src/auth/bootstrap.js";
import { createV1AuthProvider } from "../src/auth/provider.js";
import { createAuthMiddleware } from "../src/auth/middleware.js";
import { Hono } from "hono";
import { resolve } from "node:path";
import { homedir } from "node:os";

const configDir = resolve(homedir(), ".config", "personal-ai");
const token = await resolveAuthToken(configDir);
const provider = createV1AuthProvider(token);
const middleware = createAuthMiddleware(provider);

const app = new Hono();
app.use("/*", middleware);
app.get("/test", (c) => c.json({ status: "ok", actor: c.req.header("X-Actor-ID") }));

let passed = 0;
let failed = 0;

function report(label: string, ok: boolean, detail: string) {
  if (ok) {
    passed++;
    console.log(`  PASS  ${label} — ${detail}`);
  } else {
    failed++;
    console.log(`  FAIL  ${label} — ${detail}`);
  }
}

console.log("Auth check:\n");

// Test 1: Valid token → 200
const res1 = await app.request("/test", {
  headers: { Authorization: `Bearer ${token}` },
});
report(
  "Valid token",
  res1.status === 200,
  `expected 200, got ${res1.status}`,
);

// Test 2: Bad token → 401
const res2 = await app.request("/test", {
  headers: { Authorization: "Bearer wrong-token-value" },
});
report(
  "Bad token",
  res2.status === 401,
  `expected 401, got ${res2.status}`,
);

// Test 3: No token → 401
const res3 = await app.request("/test");
report(
  "No token",
  res3.status === 401,
  `expected 401, got ${res3.status}`,
);

console.log(`\nAuth check: ${passed}/${passed + failed} passed.`);

if (failed > 0) {
  process.exit(1);
}
