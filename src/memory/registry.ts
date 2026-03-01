import type {
  MemoryTools,
  ToolDefinition,
  ToolExecutor,
  ToolResult,
} from "../types/index.js";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

export const memoryToolDefinitions: ToolDefinition[] = [
  {
    name: "memory_read",
    description: "Read the content and metadata of a file from memory.",
    parameters: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Path to the file to read, relative to memory root.",
        },
      },
      required: ["path"],
    },
    source: "native:memory",
    category: "always-send",
  },
  {
    name: "memory_write",
    description: "Create or overwrite a file in memory.",
    parameters: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Path to the file to write, relative to memory root.",
        },
        content: {
          type: "string",
          description: "UTF-8 text content to write to the file.",
        },
      },
      required: ["path", "content"],
    },
    source: "native:memory",
    category: "always-send",
  },
  {
    name: "memory_edit",
    description: "Replace the first occurrence of text in an existing file.",
    parameters: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Path to the file to edit, relative to memory root.",
        },
        old_content: {
          type: "string",
          description: "Existing text to find in the file.",
        },
        new_content: {
          type: "string",
          description: "Replacement text.",
        },
      },
      required: ["path", "old_content", "new_content"],
    },
    source: "native:memory",
    category: "always-send",
  },
  {
    name: "memory_delete",
    description: "Delete a file from memory.",
    parameters: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Path to the file to delete, relative to memory root.",
        },
      },
      required: ["path"],
    },
    source: "native:memory",
    category: "always-send",
  },
  {
    name: "memory_search",
    description: "Search memory by file content or filename pattern.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query text or filename pattern.",
        },
        path: {
          type: "string",
          description: "Optional path scope, relative to memory root.",
        },
        type: {
          type: "string",
          enum: ["content", "filename"],
          description: "Search mode: file content or filenames.",
        },
      },
      required: ["query"],
    },
    source: "native:memory",
    category: "always-send",
  },
  {
    name: "memory_list",
    description: "List files and directories in memory.",
    parameters: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Directory path to list, relative to memory root.",
        },
        recursive: {
          type: "boolean",
          description: "Whether to include all nested directories.",
        },
      },
      required: ["path"],
    },
    source: "native:memory",
    category: "always-send",
  },
  {
    name: "memory_history",
    description: "Read git history for a file or directory in memory.",
    parameters: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Path to inspect, relative to memory root.",
        },
        limit: {
          type: "number",
          description: "Optional maximum number of history entries.",
        },
      },
      required: ["path"],
    },
    source: "native:memory",
    category: "always-send",
  },
];

export function createMemoryToolExecutor(memoryTools: MemoryTools): ToolExecutor {
  return {
    listTools(): ToolDefinition[] {
      return memoryToolDefinitions;
    },

    async execute(name, arguments_): Promise<ToolResult> {
      try {
        switch (name) {
          case "memory_read":
            return {
              id: name,
              output: JSON.stringify(
                await memoryTools.read(arguments_ as { path: string }),
              ),
            };
          case "memory_write":
            return {
              id: name,
              output: JSON.stringify(
                await memoryTools.write(
                  arguments_ as { path: string; content: string },
                ),
              ),
            };
          case "memory_edit":
            return {
              id: name,
              output: JSON.stringify(
                await memoryTools.edit(
                  arguments_ as {
                    path: string;
                    old_content: string;
                    new_content: string;
                  },
                ),
              ),
            };
          case "memory_delete":
            return {
              id: name,
              output: JSON.stringify(
                await memoryTools.delete(arguments_ as { path: string }),
              ),
            };
          case "memory_search":
            return {
              id: name,
              output: JSON.stringify(
                await memoryTools.search(
                  arguments_ as {
                    query: string;
                    path?: string;
                    type?: "content" | "filename";
                  },
                ),
              ),
            };
          case "memory_list":
            return {
              id: name,
              output: JSON.stringify(
                await memoryTools.list(
                  arguments_ as { path: string; recursive?: boolean },
                ),
              ),
            };
          case "memory_history":
            return {
              id: name,
              output: JSON.stringify(
                await memoryTools.history(
                  arguments_ as { path: string; limit?: number },
                ),
              ),
            };
          default:
            return {
              id: name,
              error: `Unknown tool: ${name}`,
            };
        }
      } catch (error) {
        return {
          id: name,
          error: getErrorMessage(error),
        };
      }
    },
  };
}
