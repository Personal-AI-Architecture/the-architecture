/**
 * Boot Wiring Tests
 *
 * Verifies that boot phases 2, 3, and 5 are wired:
 * - Phase 2: Adapter config loaded when available
 * - Phase 3: External tools discovered from tool_sources
 * - Phase 5: Preferences read from memory_root/preferences.json
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { boot } from "../../src/config/boot.js";

describe("Boot wiring: phases 2, 3, 5", () => {
  let memoryRoot: string;
  let configPath: string;

  beforeEach(async () => {
    memoryRoot = await mkdtemp(join(tmpdir(), "pai-boot-wiring-"));
    configPath = join(memoryRoot, "config.json");
  });

  afterEach(async () => {
    await rm(memoryRoot, { recursive: true, force: true });
    // Clean up env var if set
    delete process.env.PAI_CONFIG;
  });

  it("Phase 2: adapterConfig is null when adapter file is missing", async () => {
    await writeFile(
      configPath,
      JSON.stringify({
        memory_root: memoryRoot,
        provider_adapter: "nonexistent",
        auth_mode: "local",
        tool_sources: [],
      }),
    );

    const result = await boot(configPath);
    expect(result.adapterConfig).toBeNull();
    expect(result.status).toBe("ok");
  });

  it("Phase 3: discoveredTools populated from tool_sources", async () => {
    const toolDir = join(memoryRoot, "tools", "greet");
    await mkdir(toolDir, { recursive: true });
    await writeFile(
      join(toolDir, "tool.json"),
      JSON.stringify({
        name: "greet",
        description: "Greets the user",
        parameters: {
          type: "object",
          properties: { name: { type: "string" } },
          required: ["name"],
        },
      }),
    );

    await writeFile(
      configPath,
      JSON.stringify({
        memory_root: memoryRoot,
        provider_adapter: "nonexistent",
        auth_mode: "local",
        tool_sources: [join(memoryRoot, "tools")],
      }),
    );

    const result = await boot(configPath);
    expect(result.discoveredTools).toHaveLength(1);
    expect(result.discoveredTools[0].name).toBe("greet");
  });

  it("Phase 3: discoveredTools empty when tool_sources is empty", async () => {
    await writeFile(
      configPath,
      JSON.stringify({
        memory_root: memoryRoot,
        provider_adapter: "nonexistent",
        auth_mode: "local",
        tool_sources: [],
      }),
    );

    const result = await boot(configPath);
    expect(result.discoveredTools).toEqual([]);
  });

  it("Phase 5: preferences loaded from memory_root/preferences.json", async () => {
    await writeFile(
      join(memoryRoot, "preferences.json"),
      JSON.stringify({ default_model: "gpt-4o", language: "en" }),
    );

    await writeFile(
      configPath,
      JSON.stringify({
        memory_root: memoryRoot,
        provider_adapter: "nonexistent",
        auth_mode: "local",
        tool_sources: [],
      }),
    );

    const result = await boot(configPath);
    expect(result.preferences).toEqual({ default_model: "gpt-4o", language: "en" });
  });

  it("Phase 5: preferences default to empty when file is missing", async () => {
    await writeFile(
      configPath,
      JSON.stringify({
        memory_root: memoryRoot,
        provider_adapter: "nonexistent",
        auth_mode: "local",
        tool_sources: [],
      }),
    );

    const result = await boot(configPath);
    expect(result.preferences).toEqual({});
  });
});
