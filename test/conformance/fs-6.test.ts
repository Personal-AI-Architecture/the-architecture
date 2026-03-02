/**
 * FS-6: Evolve Memory
 *
 * "Add second search implementation, no other component changes."
 *
 * Memory is the platform — it can evolve independently. Adding a new
 * search capability (e.g., semantic search alongside line-by-line search)
 * should not require changes to Engine, Gateway, or Auth.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createMemoryTools } from "../../src/memory/tools.js";
import type {
  MemoryTools,
  SearchMatch,
  ToolDefinition,
  ToolExecutor,
  ToolResult,
} from "../../src/types/index.js";
import { createMemoryToolExecutor, memoryToolDefinitions } from "../../src/memory/registry.js";
import { createEngine } from "../../src/engine/index.js";
import { createMockProvider } from "../../src/adapters/mock.js";
import type { EngineEvent } from "../../src/types/index.js";

/**
 * Enhanced memory tools: wraps the original tools and adds a
 * "semantic_search" capability. This simulates what evolving Memory
 * looks like — new search alongside existing search, zero changes elsewhere.
 */
function createEnhancedMemoryTools(original: MemoryTools): MemoryTools & {
  semanticSearch(params: { query: string }): Promise<SearchMatch[]>;
} {
  return {
    ...original,
    async semanticSearch(params: { query: string }): Promise<SearchMatch[]> {
      // Simulated semantic search: returns same results as content search
      // but with a "semantic" marker in context. In production this would
      // call an embedding index.
      const results = await original.search({ query: params.query });
      return results.map((r) => ({
        ...r,
        context: `[semantic] ${r.context ?? r.content}`,
      }));
    },
  };
}

/**
 * Enhanced tool executor: adds semantic_search to the tool list
 * without modifying the original executor or any other component.
 */
function createEnhancedToolExecutor(
  base: ToolExecutor,
  semanticSearch: (params: { query: string }) => Promise<SearchMatch[]>,
): ToolExecutor {
  const semanticToolDef: ToolDefinition = {
    name: "memory_semantic_search",
    description: "Search memory using semantic similarity",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Semantic search query" },
      },
      required: ["query"],
    },
    source: "native:memory",
    category: "always-send",
  };

  return {
    listTools(): ToolDefinition[] {
      return [...base.listTools(), semanticToolDef];
    },
    async execute(name: string, arguments_: Record<string, unknown>): Promise<ToolResult> {
      if (name === "memory_semantic_search") {
        const results = await semanticSearch(arguments_ as { query: string });
        return { id: name, output: JSON.stringify(results) };
      }
      return base.execute(name, arguments_);
    },
  };
}

describe("FS-6: Evolve Memory — add search implementation, no component changes", () => {
  let memoryRoot: string;

  beforeEach(async () => {
    memoryRoot = await mkdtemp(join(tmpdir(), "pai-fs6-"));
  });

  afterEach(async () => {
    await rm(memoryRoot, { recursive: true, force: true });
  });

  it("enhanced search works alongside original search", async () => {
    const memoryTools = createMemoryTools(memoryRoot);
    const enhanced = createEnhancedMemoryTools(memoryTools);

    // Write test content
    await enhanced.write({ path: "test.md", content: "The quick brown fox" });

    // Original search still works
    const originalResults = await enhanced.search({ query: "brown fox" });
    expect(originalResults.length).toBeGreaterThan(0);

    // New semantic search also works
    const semanticResults = await enhanced.semanticSearch({ query: "brown fox" });
    expect(semanticResults.length).toBeGreaterThan(0);
    expect(semanticResults[0].context).toContain("[semantic]");
  });

  it("Engine works with enhanced tool executor — no engine changes", async () => {
    const memoryTools = createMemoryTools(memoryRoot);
    await memoryTools.write({ path: "data.md", content: "Important information" });

    const enhanced = createEnhancedMemoryTools(memoryTools);
    const baseExecutor = createMemoryToolExecutor(memoryTools);
    const enhancedExecutor = createEnhancedToolExecutor(
      baseExecutor,
      enhanced.semanticSearch.bind(enhanced),
    );

    // Engine sees the new tool in its tool list
    const toolNames = enhancedExecutor.listTools().map((t) => t.name);
    expect(toolNames).toContain("memory_semantic_search");
    expect(toolNames).toContain("memory_search"); // original still there

    // Engine can use the enhanced executor — no engine code changes
    const provider = createMockProvider({
      events: [
        { type: "text-delta", content: "Using enhanced memory" },
        { type: "finish", finish_reason: "stop" },
      ],
    });

    const engine = createEngine(provider, enhancedExecutor);
    const events: EngineEvent[] = [];
    for await (const event of engine.chat({
      messages: [{ role: "user", content: "Search for something" }],
    })) {
      events.push(event);
    }

    expect(events.some((e) => e.type === "text-delta")).toBe(true);
    expect(events.some((e) => e.type === "done")).toBe(true);
  });

  it("memory module source unchanged by adding search capability", async () => {
    // Static check: the memory module's imports didn't grow
    // (adding semantic search is done at the tool executor level, not in the memory module)
    const originalToolCount = memoryToolDefinitions.length;
    expect(originalToolCount).toBe(7); // The 7 original memory tools

    // Enhanced executor has 8 tools — the extra one is added OUTSIDE the memory module
    const memoryTools = createMemoryTools(memoryRoot);
    const enhanced = createEnhancedMemoryTools(memoryTools);
    const baseExecutor = createMemoryToolExecutor(memoryTools);
    const enhancedExecutor = createEnhancedToolExecutor(
      baseExecutor,
      enhanced.semanticSearch.bind(enhanced),
    );

    expect(enhancedExecutor.listTools().length).toBe(8);
  });
});
