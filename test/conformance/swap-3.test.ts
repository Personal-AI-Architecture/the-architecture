/**
 * SWAP-3: Tool Swap
 *
 * "Install tool → discovered and usable. Remove tool → system still works."
 *
 * D147: Tool swap must succeed with config-only changes — zero code changes.
 *
 * Test strategy:
 * 1. Create a tool_sources directory with a test tool (tool.json manifest)
 * 2. Build tool executor with that source — verify tool is discovered
 * 3. Remove the tool directory
 * 4. Rebuild tool executor — verify system works without the tool
 * 5. Memory tools still present throughout (they're built-in)
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

describe("SWAP-3: Tool swap — add/remove tools, zero code changes", () => {
  let memoryRoot: string;
  let toolSourcesDir: string;

  beforeEach(async () => {
    memoryRoot = await mkdtemp(join(tmpdir(), "pai-swap3-"));
    toolSourcesDir = join(memoryRoot, "tools");
    await mkdir(toolSourcesDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(memoryRoot, { recursive: true, force: true });
  });

  it("adding a tool makes it discoverable, removing it leaves system working", async () => {
    const memoryTools = createMemoryTools(memoryRoot);
    const builtInExecutor = createMemoryToolExecutor(memoryTools);

    // Install test tool: create echo-tool/tool.json
    const echoToolDir = join(toolSourcesDir, "echo-tool");
    await mkdir(echoToolDir, { recursive: true });
    await writeFile(
      join(echoToolDir, "tool.json"),
      JSON.stringify({
        name: "echo",
        description: "Echoes input back",
        parameters: {
          type: "object",
          properties: {
            text: { type: "string", description: "Text to echo" },
          },
          required: ["text"],
        },
        source: "external:echo-tool",
        category: "on-demand",
      }),
    );

    // Build tool executor with the tool source
    const executorWithTool = await createToolExecutor(builtInExecutor, [
      toolSourcesDir,
    ]);

    // Verify echo tool is discovered alongside memory tools
    const toolsWithEcho = executorWithTool.listTools();
    const toolNames = toolsWithEcho.map((t) => t.name);
    expect(toolNames).toContain("echo");
    expect(toolNames).toContain("memory_read"); // built-in still present

    // Remove the tool
    await rm(echoToolDir, { recursive: true, force: true });

    // Rebuild tool executor (simulates restart after removing tool)
    const executorWithoutTool = await createToolExecutor(builtInExecutor, [
      toolSourcesDir,
    ]);

    // Verify echo tool is gone but memory tools still work
    const toolsWithoutEcho = executorWithoutTool.listTools();
    const toolNamesAfter = toolsWithoutEcho.map((t) => t.name);
    expect(toolNamesAfter).not.toContain("echo");
    expect(toolNamesAfter).toContain("memory_read");
    expect(toolNamesAfter).toContain("memory_write");
    expect(toolNamesAfter).toContain("memory_search");

    // Memory tools still execute correctly after tool removal
    await memoryTools.write({ path: "test.txt", content: "still works" });
    const result = await memoryTools.read({ path: "test.txt" });
    expect(result.content).toBe("still works");
  });

  it("multiple tools can be installed and removed independently", async () => {
    const memoryTools = createMemoryTools(memoryRoot);
    const builtInExecutor = createMemoryToolExecutor(memoryTools);

    // Install two tools
    for (const toolName of ["tool-a", "tool-b"]) {
      const toolDir = join(toolSourcesDir, toolName);
      await mkdir(toolDir, { recursive: true });
      await writeFile(
        join(toolDir, "tool.json"),
        JSON.stringify({
          name: toolName,
          description: `Test tool ${toolName}`,
          parameters: {
            type: "object",
            properties: {},
          },
        }),
      );
    }

    const executorBoth = await createToolExecutor(builtInExecutor, [
      toolSourcesDir,
    ]);
    const bothNames = executorBoth.listTools().map((t) => t.name);
    expect(bothNames).toContain("tool-a");
    expect(bothNames).toContain("tool-b");

    // Remove only tool-a
    await rm(join(toolSourcesDir, "tool-a"), { recursive: true, force: true });

    const executorOnlyB = await createToolExecutor(builtInExecutor, [
      toolSourcesDir,
    ]);
    const onlyBNames = executorOnlyB.listTools().map((t) => t.name);
    expect(onlyBNames).not.toContain("tool-a");
    expect(onlyBNames).toContain("tool-b");
    expect(onlyBNames).toContain("memory_read"); // built-in always present
  });
});
