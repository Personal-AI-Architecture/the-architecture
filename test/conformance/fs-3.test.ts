/**
 * FS-3: Run on Your Own Hardware
 *
 * Composite test: DEPLOY-1 (offline) + DEPLOY-2 (local data) + DEPLOY-3 (localhost).
 *
 * This test verifies the complete "run on your own hardware" story:
 * the system works fully offline with local data on localhost.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, stat, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import Database from "better-sqlite3";
import { createServer } from "../../src/gateway/server.js";
import type { RuntimeConfig } from "../../src/types/index.js";

const AUTH_TOKEN = "test-token-fs3";

describe("FS-3: Run on own hardware — offline, local, localhost", () => {
  let memoryRoot: string;

  beforeEach(async () => {
    memoryRoot = await mkdtemp(join(tmpdir(), "pai-fs3-"));
  });

  afterEach(async () => {
    await rm(memoryRoot, { recursive: true, force: true });
  });

  it("full loop works offline, data is local, server is localhost-only", async () => {
    const config: RuntimeConfig = {
      memory_root: memoryRoot,
      provider_adapter: "mock",
      default_model: "local-model",
      tool_sources: [],
    };

    const app = await createServer({
      config,
      authToken: AUTH_TOKEN,
    });

    // DEPLOY-1: Full loop with mock provider (no network)
    const response = await app.request(
      "http://localhost/conversations/messages",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${AUTH_TOKEN}`,
        },
        body: JSON.stringify({
          message: { role: "user", content: "Running on my hardware" },
        }),
      },
    );
    expect(response.status).toBe(200);
    const body = await response.text();
    expect(body).toContain("event: text-delta");
    expect(body).toContain("event: done");

    // DEPLOY-2: Data is local
    const dbPath = join(memoryRoot, ".data", "conversations.db");
    const dbStat = await stat(dbPath);
    expect(dbStat.isFile()).toBe(true);

    const db = new Database(dbPath);
    const convCount = (
      db.prepare("SELECT COUNT(*) AS count FROM conversations").get() as {
        count: number;
      }
    ).count;
    expect(convCount).toBeGreaterThanOrEqual(1);
    db.close();

    // DEPLOY-3: Server binds to 127.0.0.1
    const serverSource = await readFile(
      resolve(import.meta.dirname, "../../src/gateway/server.ts"),
      "utf-8",
    );
    expect(serverSource).toContain('"127.0.0.1"');
    expect(serverSource).not.toContain('"0.0.0.0"');
  });
});
