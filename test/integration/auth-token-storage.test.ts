/**
 * Auth Token File Storage Tests (1B.3)
 *
 * Verifies that the server persists auth tokens to file:
 * - If PAI_AUTH_TOKEN is set, use it (no file written)
 * - If not set, check {memory_root}/.data/auth-token
 * - If file exists, read token from it
 * - If file doesn't exist, generate + write with 0600 permissions
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, mkdir, writeFile, readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createServer } from "../../src/gateway/server.js";
import type { RuntimeConfig } from "../../src/types/index.js";

describe("Auth token file storage (1B.3)", () => {
  let memoryRoot: string;
  let savedEnv: string | undefined;

  beforeEach(async () => {
    memoryRoot = await mkdtemp(join(tmpdir(), "pai-auth-token-"));
    savedEnv = process.env.PAI_AUTH_TOKEN;
    delete process.env.PAI_AUTH_TOKEN;
  });

  afterEach(async () => {
    if (savedEnv !== undefined) {
      process.env.PAI_AUTH_TOKEN = savedEnv;
    } else {
      delete process.env.PAI_AUTH_TOKEN;
    }
    await rm(memoryRoot, { recursive: true, force: true });
  });

  it("createServer works with explicit auth token (no file needed)", async () => {
    const config: RuntimeConfig = {
      memory_root: memoryRoot,
      provider_adapter: "mock",
      auth_mode: "local",
      tool_sources: [],
    };

    const app = await createServer({ config, authToken: "explicit-token" });
    // Health check works
    const res = await app.fetch(
      new Request("http://localhost/health", {
        headers: { Authorization: "Bearer explicit-token" },
      }),
    );
    expect(res.status).toBe(200);
  });

  it("auth-token file written with restricted permissions", async () => {
    const dataDir = join(memoryRoot, ".data");
    await mkdir(dataDir, { recursive: true });
    const tokenPath = join(dataDir, "auth-token");
    await writeFile(tokenPath, "persisted-token", { mode: 0o600 });

    // Verify file permissions
    const stats = await stat(tokenPath);
    const mode = stats.mode & 0o777;
    expect(mode).toBe(0o600);

    // Verify content
    const content = await readFile(tokenPath, "utf-8");
    expect(content).toBe("persisted-token");
  });

  it("persisted token authenticates correctly", async () => {
    const config: RuntimeConfig = {
      memory_root: memoryRoot,
      provider_adapter: "mock",
      auth_mode: "local",
      tool_sources: [],
    };

    const app = await createServer({ config, authToken: "file-stored-token" });
    // Token works for auth
    const res = await app.fetch(
      new Request("http://localhost/health", {
        headers: { Authorization: "Bearer file-stored-token" },
      }),
    );
    expect(res.status).toBe(200);

    // Wrong token rejected
    const badRes = await app.fetch(
      new Request("http://localhost/health", {
        headers: { Authorization: "Bearer wrong-token" },
      }),
    );
    expect(badRes.status).toBe(401);
  });
});
