import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { boot } from "../../src/config/boot.js";
import { writeFile, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { tmpdir } from "node:os";

const TEST_DIR = resolve(tmpdir(), "pai-boot-test-" + process.pid);
const MEMORY_DIR = resolve(TEST_DIR, "test-memory");

beforeEach(async () => {
  await mkdir(MEMORY_DIR, { recursive: true });
});

afterEach(async () => {
  await rm(TEST_DIR, { recursive: true, force: true });
});

function writeConfig(overrides: Record<string, unknown> = {}) {
  const config = {
    memory_root: MEMORY_DIR,
    provider_adapter: "openrouter",
    auth_mode: "local",
    tool_sources: ["./tools/"],
    ...overrides,
  };
  const configPath = resolve(TEST_DIR, "config.json");
  return writeFile(configPath, JSON.stringify(config)).then(() => configPath);
}

describe("Boot Sequence", () => {
  it("phase 1: loads config from file and returns typed object", async () => {
    const configPath = await writeConfig();

    const result = await boot(configPath);

    expect(result.config).toBeDefined();
    expect(result.config.memory_root).toBe(MEMORY_DIR);
    expect(result.config.provider_adapter).toBe("openrouter");
    expect(result.config.auth_mode).toBe("local");
    expect(result.config.tool_sources).toEqual(["./tools/"]);
    expect(result.status).toBe("ok");
  });

  it("phase 4: validates memory_root exists", async () => {
    const configPath = await writeConfig();

    const result = await boot(configPath);
    expect(result.status).toBe("ok");
  });

  it("fails on nonexistent memory_root with clear error", async () => {
    const configPath = await writeConfig({
      memory_root: resolve(TEST_DIR, "does-not-exist"),
    });

    await expect(boot(configPath)).rejects.toThrow("memory_root does not exist");
  });

  it("fails on memory_root that is a file, not a directory", async () => {
    const filePath = resolve(TEST_DIR, "not-a-dir");
    await writeFile(filePath, "I am a file");

    const configPath = await writeConfig({
      memory_root: filePath,
    });

    await expect(boot(configPath)).rejects.toThrow("not a directory");
  });

  it("fails with clear error when config file is missing", async () => {
    await expect(
      boot(resolve(TEST_DIR, "nonexistent-config.json")),
    ).rejects.toThrow("Config file not found");
  });
});
