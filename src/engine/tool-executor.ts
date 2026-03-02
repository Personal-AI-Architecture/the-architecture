import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import type { ToolDefinition, ToolExecutor, ToolResult } from "../types/index.js";

function isToolDefinition(value: unknown): value is ToolDefinition {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as {
    name?: unknown;
    description?: unknown;
    parameters?: unknown;
  };

  if (typeof candidate.name !== "string") {
    return false;
  }
  if (typeof candidate.description !== "string") {
    return false;
  }
  if (typeof candidate.parameters !== "object" || candidate.parameters === null) {
    return false;
  }

  return true;
}

async function discoverExternalTools(toolSources: string[]): Promise<ToolDefinition[]> {
  const discoveredTools: ToolDefinition[] = [];

  for (const sourcePath of toolSources) {
    try {
      const entries = await readdir(sourcePath, {
        withFileTypes: true,
        encoding: "utf8",
      });

      for (const entry of entries) {
        if (!entry.isDirectory()) {
          continue;
        }

        const manifestPath = resolve(sourcePath, entry.name, "tool.json");
        let manifestRaw: string;

        try {
          manifestRaw = await readFile(manifestPath, "utf-8");
        } catch {
          continue;
        }

        try {
          const parsedManifest = JSON.parse(manifestRaw) as unknown;
          if (isToolDefinition(parsedManifest)) {
            discoveredTools.push(parsedManifest);
          }
        } catch {
          // Malformed JSON is intentionally ignored.
        }
      }
    } catch {
      // Missing or unreadable source path is intentionally ignored.
      continue;
    }
  }

  return discoveredTools;
}

export async function createToolExecutor(
  builtInExecutor: ToolExecutor,
  toolSources: string[],
): Promise<ToolExecutor> {
  const discoveredTools = await discoverExternalTools(toolSources);
  const discoveredByName = new Map<string, ToolDefinition>();

  for (const tool of discoveredTools) {
    if (!discoveredByName.has(tool.name)) {
      discoveredByName.set(tool.name, tool);
    }
  }

  return {
    listTools(): ToolDefinition[] {
      const builtInTools = builtInExecutor.listTools();
      const allByName = new Map<string, ToolDefinition>();

      for (const tool of builtInTools) {
        allByName.set(tool.name, tool);
      }
      for (const [name, tool] of discoveredByName.entries()) {
        if (!allByName.has(name)) {
          allByName.set(name, tool);
        }
      }

      return [...allByName.values()];
    },

    async execute(name, arguments_): Promise<ToolResult> {
      const builtInNames = new Set(
        builtInExecutor.listTools().map((toolDefinition) => toolDefinition.name),
      );

      if (builtInNames.has(name)) {
        return builtInExecutor.execute(name, arguments_);
      }

      if (discoveredByName.has(name)) {
        return {
          id: name,
          error: "External tool execution not implemented",
        };
      }

      return {
        id: name,
        error: `Unknown tool: ${name}`,
      };
    },
  };
}
