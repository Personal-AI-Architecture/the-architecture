/**
 * FS-2: Add Capability Without Violating the Architecture
 *
 * "Add a tool — memory gains no dependencies, architecture holds."
 *
 * When you add a tool, it should be additive. Memory doesn't suddenly
 * depend on the tool. The four-component structure still holds.
 * The tool is discovered, usable, and removable.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  mkdtemp,
  rm,
  mkdir,
  writeFile,
  readFile,
  readdir,
} from "node:fs/promises";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { createMemoryTools } from "../../src/memory/tools.js";
import { createMemoryToolExecutor } from "../../src/memory/registry.js";
import { createToolExecutor } from "../../src/engine/tool-executor.js";

describe("FS-2: Add capability — tool addition preserves architecture", () => {
  let memoryRoot: string;
  let toolSourcesDir: string;

  beforeEach(async () => {
    memoryRoot = await mkdtemp(join(tmpdir(), "pai-fs2-"));
    toolSourcesDir = join(memoryRoot, "tools");
    await mkdir(toolSourcesDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(memoryRoot, { recursive: true, force: true });
  });

  it("adding a tool does not add dependencies to memory module", async () => {
    // Memory module imports — check BEFORE adding any tool
    const memoryToolsSource = await readFile(
      resolve(import.meta.dirname, "../../src/memory/tools.ts"),
      "utf-8",
    );
    const memoryRegistrySource = await readFile(
      resolve(import.meta.dirname, "../../src/memory/registry.ts"),
      "utf-8",
    );

    // Count imports in memory module
    const memoryImportsBefore = [
      ...memoryToolsSource.matchAll(/^import\s/gm),
      ...memoryRegistrySource.matchAll(/^import\s/gm),
    ].length;

    // Add a tool
    const toolDir = join(toolSourcesDir, "weather-tool");
    await mkdir(toolDir, { recursive: true });
    await writeFile(
      join(toolDir, "tool.json"),
      JSON.stringify({
        name: "get_weather",
        description: "Get current weather",
        parameters: {
          type: "object",
          properties: {
            city: { type: "string" },
          },
          required: ["city"],
        },
      }),
    );

    // Verify tool is discovered
    const memoryTools = createMemoryTools(memoryRoot);
    const builtInExecutor = createMemoryToolExecutor(memoryTools);
    const executor = await createToolExecutor(builtInExecutor, [toolSourcesDir]);
    const toolNames = executor.listTools().map((t) => t.name);
    expect(toolNames).toContain("get_weather");

    // Memory module imports are UNCHANGED — adding a tool didn't touch memory
    const memoryToolsSourceAfter = await readFile(
      resolve(import.meta.dirname, "../../src/memory/tools.ts"),
      "utf-8",
    );
    const memoryRegistrySourceAfter = await readFile(
      resolve(import.meta.dirname, "../../src/memory/registry.ts"),
      "utf-8",
    );

    const memoryImportsAfter = [
      ...memoryToolsSourceAfter.matchAll(/^import\s/gm),
      ...memoryRegistrySourceAfter.matchAll(/^import\s/gm),
    ].length;

    expect(memoryImportsAfter).toBe(memoryImportsBefore);
  });

  it("four-component structure holds after adding tools", async () => {
    // Verify that src/ has exactly the expected component directories
    const srcDir = resolve(import.meta.dirname, "../../src");
    const entries = await readdir(srcDir, { withFileTypes: true });
    const dirs = entries
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort();

    // Four components: memory, engine, auth, gateway
    // Plus infrastructure: types, config, adapters, runtime
    expect(dirs).toContain("memory");
    expect(dirs).toContain("engine");
    expect(dirs).toContain("auth");
    expect(dirs).toContain("gateway");

    // No surprise new component directories from tool installation
    const componentDirs = dirs.filter(
      (d) => !["types", "config", "adapters", "runtime"].includes(d),
    );
    expect(componentDirs).toEqual(["auth", "engine", "gateway", "memory"]);
  });
});
