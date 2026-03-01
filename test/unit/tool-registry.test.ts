/**
 * Tool Registry — Unit Tests
 *
 * Tests the memory tool self-description registry and executor routing.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { tmpdir } from "node:os";
import type { ToolExecutor, ToolDefinition } from "../../src/types/index.js";

let createMemoryTools: (root: string) => import("../../src/types/index.js").MemoryTools;
let createMemoryToolExecutor: (tools: import("../../src/types/index.js").MemoryTools) => ToolExecutor;
let memoryToolDefinitions: ToolDefinition[];

let memoryRoot: string;
let executor: ToolExecutor;

beforeEach(async () => {
  const toolsMod = await import("../../src/memory/tools.js");
  const registryMod = await import("../../src/memory/registry.js");
  createMemoryTools = toolsMod.createMemoryTools;
  createMemoryToolExecutor = registryMod.createMemoryToolExecutor;
  memoryToolDefinitions = registryMod.memoryToolDefinitions;

  memoryRoot = await mkdtemp(join(tmpdir(), "pai-registry-test-"));
  const tools = createMemoryTools(memoryRoot);
  executor = createMemoryToolExecutor(tools);
});

afterEach(async () => {
  await rm(memoryRoot, { recursive: true, force: true });
});

describe("Tool self-description registry", () => {
  it("registers exactly 7 memory tools", () => {
    const tools = executor.listTools();
    expect(tools).toHaveLength(7);
  });

  it("all tools have required ToolDefinition fields", () => {
    const tools = executor.listTools();

    for (const tool of tools) {
      expect(tool.name).toBeTruthy();
      expect(typeof tool.name).toBe("string");
      expect(tool.description).toBeTruthy();
      expect(typeof tool.description).toBe("string");
      expect(tool.parameters).toBeDefined();
      expect(tool.parameters.type).toBe("object");
      expect(tool.parameters.properties).toBeDefined();
    }
  });

  it("all tools have source 'native:memory' and category 'always-send'", () => {
    const tools = executor.listTools();

    for (const tool of tools) {
      expect(tool.source).toBe("native:memory");
      expect(tool.category).toBe("always-send");
    }
  });

  it("tool names are prefixed with memory_", () => {
    const tools = executor.listTools();
    const names = tools.map((t) => t.name);

    expect(names).toContain("memory_read");
    expect(names).toContain("memory_write");
    expect(names).toContain("memory_edit");
    expect(names).toContain("memory_delete");
    expect(names).toContain("memory_search");
    expect(names).toContain("memory_list");
    expect(names).toContain("memory_history");
  });

  it("memoryToolDefinitions export matches listTools()", () => {
    expect(memoryToolDefinitions).toEqual(executor.listTools());
  });
});

describe("Tool executor routing", () => {
  it("execute('memory_read') calls read implementation", async () => {
    await writeFile(resolve(memoryRoot, "test.md"), "hello");

    const result = await executor.execute("memory_read", { path: "test.md" });

    expect(result.id).toBe("memory_read");
    expect(result.error).toBeUndefined();
    expect(result.output).toBeTruthy();

    const parsed = JSON.parse(result.output!);
    expect(parsed.content).toBe("hello");
  });

  it("execute('memory_write') calls write implementation", async () => {
    const result = await executor.execute("memory_write", {
      path: "new.md",
      content: "written via executor",
    });

    expect(result.id).toBe("memory_write");
    expect(result.error).toBeUndefined();

    const parsed = JSON.parse(result.output!);
    expect(parsed.success).toBe(true);
  });

  it("execute('memory_list') calls list implementation", async () => {
    await writeFile(resolve(memoryRoot, "a.md"), "a");
    await writeFile(resolve(memoryRoot, "b.md"), "b");

    const result = await executor.execute("memory_list", { path: "." });

    expect(result.id).toBe("memory_list");
    expect(result.error).toBeUndefined();

    const parsed = JSON.parse(result.output!);
    expect(parsed.length).toBeGreaterThanOrEqual(2);
  });

  it("returns error for unknown tool name", async () => {
    const result = await executor.execute("nonexistent_tool", {});

    expect(result.error).toBeTruthy();
    expect(result.error).toContain("nonexistent_tool");
  });

  it("returns error when tool throws", async () => {
    // Read a nonexistent file — should return error, not throw
    const result = await executor.execute("memory_read", {
      path: "does-not-exist.md",
    });

    expect(result.id).toBe("memory_read");
    expect(result.error).toBeTruthy();
    expect(result.output).toBeUndefined();
  });
});
