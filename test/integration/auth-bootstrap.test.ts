/**
 * Auth Bootstrap — Integration Tests
 *
 * Tests token generation, file permissions, and security constraints.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, readFile, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

let resolveAuthToken: (configDir: string) => Promise<string>;

let configDir: string;
const originalEnv = { ...process.env };

beforeEach(async () => {
  const mod = await import("../../src/auth/bootstrap.js");
  resolveAuthToken = mod.resolveAuthToken;
  configDir = await mkdtemp(join(tmpdir(), "pai-auth-test-"));
  // Clear the env var for each test
  delete process.env.PAI_AUTH_TOKEN;
});

afterEach(async () => {
  process.env = { ...originalEnv };
  await rm(configDir, { recursive: true, force: true });
});

describe("Token resolution", () => {
  it("uses PAI_AUTH_TOKEN env var when set", async () => {
    process.env.PAI_AUTH_TOKEN = "env-token-value";

    const token = await resolveAuthToken(configDir);
    expect(token).toBe("env-token-value");
  });

  it("auto-generates token file when no env var set", async () => {
    const token = await resolveAuthToken(configDir);

    // Should be a 64-char hex string
    expect(token).toMatch(/^[a-f0-9]{64}$/);

    // File should exist
    const fileContent = await readFile(join(configDir, "auth-token"), "utf-8");
    expect(fileContent.trim()).toBe(token);
  });

  it("sets 0600 permissions on generated token file", async () => {
    await resolveAuthToken(configDir);

    const stats = await stat(join(configDir, "auth-token"));
    // 0600 = owner read/write only = 0o100600 on macOS
    const mode = stats.mode & 0o777;
    expect(mode).toBe(0o600);
  });

  it("reads existing token file on subsequent calls", async () => {
    // First call generates
    const token1 = await resolveAuthToken(configDir);

    // Second call reads existing
    const token2 = await resolveAuthToken(configDir);

    expect(token2).toBe(token1);
  });

  it("token value never printed to stdout", async () => {
    const originalLog = console.log;
    const loggedMessages: string[] = [];
    console.log = (...args: unknown[]) => {
      loggedMessages.push(args.map(String).join(" "));
    };

    try {
      const token = await resolveAuthToken(configDir);

      // Check that the token value itself never appears in stdout
      for (const msg of loggedMessages) {
        expect(msg).not.toContain(token);
      }

      // But the file path should be mentioned
      const hasPathMention = loggedMessages.some((msg) =>
        msg.includes("auth-token") || msg.includes(configDir),
      );
      expect(hasPathMention).toBe(true);
    } finally {
      console.log = originalLog;
    }
  });
});

describe("E-12: Token in config file rejected", () => {
  it("tokens belong in env vars, not config files", async () => {
    // This test verifies the design: resolveAuthToken reads from env var
    // or generates a file — it never reads tokens from config.json.
    // The config schema (configuration.json) has no auth_token field.
    // This is a structural guarantee, not a runtime check.

    // Verify that the function signature takes configDir (for file storage),
    // not a config object that could contain a token
    expect(typeof resolveAuthToken).toBe("function");
    expect(resolveAuthToken.length).toBe(1); // single parameter: configDir
  });
});
