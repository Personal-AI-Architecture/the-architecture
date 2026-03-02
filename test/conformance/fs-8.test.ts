/**
 * FS-8: Expand Scope via Tools
 *
 * "Add filesystem tool, works without architecture changes."
 *
 * The expanding-sphere model (D12): scope grows by adding tools,
 * not by changing architecture. V1 = library folder tools,
 * V2 = system tools, V3 = external APIs, V4 = inbound.
 *
 * Test: add a filesystem tool that works outside memory_root,
 * verify it's discovered and the system works. No architecture changes.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  mkdtemp,
  rm,
  mkdir,
  writeFile,
} from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createMemoryTools } from "../../src/memory/tools.js";
import { createMemoryToolExecutor } from "../../src/memory/registry.js";
import { createToolExecutor } from "../../src/engine/tool-executor.js";
import { createMockProvider } from "../../src/adapters/mock.js";
import { createEngine } from "../../src/engine/index.js";
import type { EngineEvent } from "../../src/types/index.js";

describe("FS-8: Expand scope — add tool, no architecture changes", () => {
  let memoryRoot: string;
  let toolSourcesDir: string;

  beforeEach(async () => {
    memoryRoot = await mkdtemp(join(tmpdir(), "pai-fs8-"));
    toolSourcesDir = join(memoryRoot, "tools");
    await mkdir(toolSourcesDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(memoryRoot, { recursive: true, force: true });
  });

  it("filesystem tool discovered alongside memory tools", async () => {
    // Create a filesystem tool manifest (V2 scope — system tools)
    const fsToolDir = join(toolSourcesDir, "filesystem");
    await mkdir(fsToolDir, { recursive: true });
    await writeFile(
      join(fsToolDir, "tool.json"),
      JSON.stringify({
        name: "fs_read_file",
        description: "Read any file on the local filesystem",
        parameters: {
          type: "object",
          properties: {
            path: {
              type: "string",
              description: "Absolute path to the file",
            },
          },
          required: ["path"],
        },
        source: "external:filesystem",
        category: "on-demand",
      }),
    );

    const memoryTools = createMemoryTools(memoryRoot);
    const builtInExecutor = createMemoryToolExecutor(memoryTools);
    const executor = await createToolExecutor(builtInExecutor, [toolSourcesDir]);

    const toolNames = executor.listTools().map((t) => t.name);

    // New filesystem tool is discovered
    expect(toolNames).toContain("fs_read_file");

    // Memory tools still present
    expect(toolNames).toContain("memory_read");
    expect(toolNames).toContain("memory_write");
    expect(toolNames).toContain("memory_search");
  });

  it("Engine works with expanded tool set — no engine changes", async () => {
    // Add an API tool (V3 scope — external APIs)
    const apiToolDir = join(toolSourcesDir, "weather-api");
    await mkdir(apiToolDir, { recursive: true });
    await writeFile(
      join(apiToolDir, "tool.json"),
      JSON.stringify({
        name: "get_weather",
        description: "Get current weather for a city",
        parameters: {
          type: "object",
          properties: {
            city: { type: "string" },
          },
          required: ["city"],
        },
        source: "external:weather-api",
        category: "on-demand",
      }),
    );

    const memoryTools = createMemoryTools(memoryRoot);
    const builtInExecutor = createMemoryToolExecutor(memoryTools);
    const executor = await createToolExecutor(builtInExecutor, [toolSourcesDir]);

    // Engine sees the expanded tool set
    const provider = createMockProvider({
      events: [
        { type: "text-delta", content: "Expanded scope works" },
        { type: "finish", finish_reason: "stop" },
      ],
    });

    const engine = createEngine(provider, executor);
    const events: EngineEvent[] = [];
    for await (const event of engine.chat({
      messages: [{ role: "user", content: "What's the weather?" }],
    })) {
      events.push(event);
    }

    // Engine works — it doesn't care what tools are available
    expect(events.some((e) => e.type === "text-delta")).toBe(true);
    expect(events.some((e) => e.type === "done")).toBe(true);
  });

  it("multiple scope expansions compose without interference", async () => {
    // Add tools at three different scope levels
    for (const [name, desc] of [
      ["file-browser", "Browse local filesystem"],
      ["web-search", "Search the internet"],
      ["email-reader", "Read incoming emails"],
    ]) {
      const toolDir = join(toolSourcesDir, name);
      await mkdir(toolDir, { recursive: true });
      await writeFile(
        join(toolDir, "tool.json"),
        JSON.stringify({
          name: name.replace("-", "_"),
          description: desc,
          parameters: {
            type: "object",
            properties: {},
          },
        }),
      );
    }

    const memoryTools = createMemoryTools(memoryRoot);
    const builtInExecutor = createMemoryToolExecutor(memoryTools);
    const executor = await createToolExecutor(builtInExecutor, [toolSourcesDir]);

    const toolNames = executor.listTools().map((t) => t.name);
    expect(toolNames).toContain("file_browser");
    expect(toolNames).toContain("web_search");
    expect(toolNames).toContain("email_reader");
    expect(toolNames).toContain("memory_read"); // built-in always present
  });
});
