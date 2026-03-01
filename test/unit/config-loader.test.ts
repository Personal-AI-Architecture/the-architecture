import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { loadConfig, ConfigError } from "../../src/config/loader.js";
import { writeFile, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { tmpdir } from "node:os";
import fc from "fast-check";

const TEST_DIR = resolve(tmpdir(), "pai-config-test-" + process.pid);

beforeEach(async () => {
  await mkdir(TEST_DIR, { recursive: true });
});

afterEach(async () => {
  await rm(TEST_DIR, { recursive: true, force: true });
  delete process.env.PAI_CONFIG;
});

function validConfig() {
  return {
    memory_root: "/tmp/test-memory",
    provider_adapter: "openrouter",
    auth_mode: "local",
    tool_sources: ["./tools/"],
  };
}

describe("Config Loader", () => {
  it("accepts a valid config", async () => {
    const configPath = resolve(TEST_DIR, "config.json");
    await writeFile(configPath, JSON.stringify(validConfig()));

    const config = await loadConfig(configPath);

    expect(config.memory_root).toBe("/tmp/test-memory");
    expect(config.provider_adapter).toBe("openrouter");
    expect(config.auth_mode).toBe("local");
    expect(config.tool_sources).toEqual(["./tools/"]);
  });

  it("rejects config with missing required fields", async () => {
    const configPath = resolve(TEST_DIR, "config.json");
    // Missing memory_root and tool_sources
    await writeFile(
      configPath,
      JSON.stringify({ provider_adapter: "openrouter", auth_mode: "local" }),
    );

    await expect(loadConfig(configPath)).rejects.toThrow(ConfigError);
    await expect(loadConfig(configPath)).rejects.toThrow("Invalid configuration");
  });

  it("rejects config with wrong types", async () => {
    const configPath = resolve(TEST_DIR, "config.json");
    await writeFile(
      configPath,
      JSON.stringify({
        memory_root: 123, // should be string
        provider_adapter: "openrouter",
        auth_mode: "local",
        tool_sources: ["./tools/"],
      }),
    );

    await expect(loadConfig(configPath)).rejects.toThrow(ConfigError);
  });

  it("rejects config with additional properties", async () => {
    const configPath = resolve(TEST_DIR, "config.json");
    await writeFile(
      configPath,
      JSON.stringify({
        ...validConfig(),
        extra_field: "not allowed",
      }),
    );

    await expect(loadConfig(configPath)).rejects.toThrow(ConfigError);
  });

  it("rejects non-existent config file", async () => {
    await expect(
      loadConfig(resolve(TEST_DIR, "nonexistent.json")),
    ).rejects.toThrow("Config file not found");
  });

  it("rejects invalid JSON", async () => {
    const configPath = resolve(TEST_DIR, "config.json");
    await writeFile(configPath, "{ not valid json }}}");

    await expect(loadConfig(configPath)).rejects.toThrow("not valid JSON");
  });

  it("loads config from PAI_CONFIG env var", async () => {
    const configPath = resolve(TEST_DIR, "custom-config.json");
    await writeFile(configPath, JSON.stringify(validConfig()));

    process.env.PAI_CONFIG = configPath;
    const config = await loadConfig();

    expect(config.memory_root).toBe("/tmp/test-memory");
  });
});

describe("Config Schema Validation (Property)", () => {
  it("P-7: random valid configs accepted, random invalid configs rejected", async () => {
    // Valid config arbitrary
    const validConfigArb = fc.record({
      memory_root: fc.string({ minLength: 1 }),
      provider_adapter: fc.string({ minLength: 1 }),
      auth_mode: fc.string({ minLength: 1 }),
      tool_sources: fc.array(fc.string()),
    });

    // Invalid config: missing required fields
    const invalidConfigArb = fc.oneof(
      // Missing memory_root
      fc.record({
        provider_adapter: fc.string({ minLength: 1 }),
        auth_mode: fc.string({ minLength: 1 }),
        tool_sources: fc.array(fc.string()),
      }),
      // Wrong type for memory_root
      fc.record({
        memory_root: fc.integer(),
        provider_adapter: fc.string({ minLength: 1 }),
        auth_mode: fc.string({ minLength: 1 }),
        tool_sources: fc.array(fc.string()),
      }),
      // Extra properties
      fc.record({
        memory_root: fc.string({ minLength: 1 }),
        provider_adapter: fc.string({ minLength: 1 }),
        auth_mode: fc.string({ minLength: 1 }),
        tool_sources: fc.array(fc.string()),
        extra: fc.string(),
      }),
    );

    // Valid configs should be accepted
    await fc.assert(
      fc.asyncProperty(validConfigArb, async (config) => {
        const configPath = resolve(TEST_DIR, "prop-valid.json");
        await writeFile(configPath, JSON.stringify(config));
        const result = await loadConfig(configPath);
        expect(result.memory_root).toBe(config.memory_root);
      }),
      { numRuns: 20 },
    );

    // Invalid configs should be rejected
    await fc.assert(
      fc.asyncProperty(invalidConfigArb, async (config) => {
        const configPath = resolve(TEST_DIR, "prop-invalid.json");
        await writeFile(configPath, JSON.stringify(config));
        await expect(loadConfig(configPath)).rejects.toThrow(ConfigError);
      }),
      { numRuns: 20 },
    );
  });
});
