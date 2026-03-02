# Phase 2: Engine — Codex Task

## Project Location

**Repo root:** `/Users/davidwaring/personal-ai-architecture`

All paths in this file are relative to the repo root unless stated otherwise.

**Key files you need to read before starting:**
- `src/types/index.ts` — all type definitions (EngineRequest, EngineEvent, ProviderAdapter, ToolExecutor, etc.)
- `src/types/generated.ts` — generated types from JSON schemas (Message, ToolDefinition)
- `src/memory/registry.ts` — existing MemoryToolExecutor (implements ToolExecutor interface — this is what gets passed as `builtInExecutor`)
- `src/memory/tools.ts` — existing memory tool implementations (for understanding, not for importing)
- `package.json` — build scripts and dependencies

**Files you will create:**
- `src/engine/index.ts` — Engine core
- `src/engine/tool-executor.ts` — combined tool executor with discovery

**Verification commands (run from repo root):**
```bash
cd /Users/davidwaring/personal-ai-architecture
npm run build
npm run check:imports
npm run check:lockin
npm run lint
```

---

## What You're Building

The Engine — a generic agent loop that connects a model to tools and streams results back. Message → model → tools → response → repeat. The Engine is intentionally generic — it has no product-specific logic. What makes any product unique lives in Memory, not the Engine.

You are building **two things**:
1. `src/engine/index.ts` — the Engine core: agent loop and chat function
2. `src/engine/tool-executor.ts` — combined tool executor with external tool discovery

## Interfaces You Must Implement

All types are already defined in `src/types/index.ts`. Do not modify the type definitions.

### EngineRequest (from `src/types/index.ts`)

```typescript
interface EngineRequest {
  messages: Message[];
  metadata?: RequestMetadata;
}
```

### EngineEvent (from `src/types/index.ts`)

```typescript
type EngineEvent =
  | { type: "text-delta"; content: string }
  | { type: "tool-call"; id: string; name: string; arguments: Record<string, unknown> }
  | { type: "tool-result"; id: string; output?: string; error?: string }
  | { type: "done"; finish_reason: string; usage?: { prompt_tokens: number; completion_tokens: number } }
  | { type: "error"; code: "provider_error" | "tool_error" | "context_overflow"; message: string };
```

### ProviderAdapter (from `src/types/index.ts`)

```typescript
interface ProviderAdapter {
  complete(
    messages: Message[],
    tools: ToolDefinition[],
  ): AsyncIterable<ProviderEvent>;
}
```

### ProviderEvent (from `src/types/index.ts`)

```typescript
type ProviderEvent =
  | { type: "text-delta"; content: string }
  | { type: "tool-call"; id: string; name: string; arguments: Record<string, unknown> }
  | { type: "finish"; finish_reason: "stop" | "tool_calls" | "max_tokens"; usage?: { prompt_tokens: number; completion_tokens: number } }
  | { type: "error"; code: string; message: string };
```

### ToolExecutor (from `src/types/index.ts`)

```typescript
interface ToolExecutor {
  execute(name: string, arguments_: Record<string, unknown>): Promise<ToolResult>;
  listTools(): ToolDefinition[];
}
```

### ToolResult (from `src/types/index.ts`)

```typescript
interface ToolResult {
  id: string;
  output?: string;
  error?: string;
}
```

### ToolDefinition (from `src/types/generated.ts`)

```typescript
interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  source?: string;
  category?: string;
}
```

### Message (from `src/types/generated.ts`)

Messages have `role` ("system" | "user" | "assistant" | "tool"), `content` (string), optional `tool_calls` (array of `{ id: string; type: string; function: { name: string; arguments: string } }`), and optional `tool_call_id` (string for tool-role messages).

---

## File 1: `src/engine/index.ts`

Export:

```typescript
export function createEngine(
  provider: ProviderAdapter,
  toolExecutor: ToolExecutor,
  options?: { maxIterations?: number; toolTimeout?: number },
): { chat(request: EngineRequest): AsyncIterable<EngineEvent> }
```

### Behavior

**`createEngine(provider, toolExecutor, options?)`**

Returns an object with a single method: `chat()`. The Engine is stateless — no mutable state persists between `chat()` calls.

Options:
- `maxIterations` — maximum number of model calls before stopping (default 50). Prevents infinite tool loops.
- `toolTimeout` — milliseconds before a tool execution is aborted (default 30000). Prevents hung tools from blocking the loop.

**`chat(request: EngineRequest): AsyncIterable<EngineEvent>`**

The async generator that runs the agent loop:

1. **Get tool definitions** — call `toolExecutor.listTools()` to get all available tools
2. **Call the provider** — `provider.complete(request.messages, tools)` — iterate the async iterable
3. **Process provider events:**
   - `text-delta` → yield `{ type: "text-delta", content }` (pass through)
   - `tool-call` → collect it (don't execute yet — wait for the finish event)
   - `finish` with `finish_reason: "tool_calls"` → execute all collected tool calls, yield events, loop back to step 2
   - `finish` with `finish_reason: "stop"` or `"max_tokens"` → yield `{ type: "done", finish_reason, usage }`, return
   - `error` → yield `{ type: "error", code: "provider_error", message }`, return
4. **Execute tool calls** (when finish_reason is "tool_calls"):
   - For each collected tool call, yield `{ type: "tool-call", id, name, arguments }`
   - Execute all tool calls (can be parallel with `Promise.all`)
   - For each result, yield `{ type: "tool-result", id, output?, error? }`
   - Append assistant message with `tool_calls` to the messages array
   - Append one `tool` message per tool result to the messages array
   - Increment iteration counter. If counter >= `maxIterations`, yield `{ type: "error", code: "provider_error", message: "Max iterations reached" }` and return
   - Loop back to step 2 with the updated messages array
5. **Tool execution with timeout:**
   - Wrap each `toolExecutor.execute()` call with a timeout using `Promise.race`
   - If the tool doesn't complete within `toolTimeout` ms, return `{ id, error: "Tool execution timed out" }`
6. **Tool execution failure:**
   - If `toolExecutor.execute()` returns a result with an `error` field, that error is reported to the model as a tool message — the model decides what to do next
   - The Engine does NOT retry failed tools
7. **Provider exception handling:**
   - If the provider's async iterable throws an exception (not a yielded error event), catch it and yield `{ type: "error", code: "provider_error", message: <exception message> }`
8. **Messages passthrough:**
   - The Engine passes `request.messages` directly to the provider — it does NOT construct, modify, or inject any system prompts
   - When looping after tool execution, the Engine appends tool call/result messages to the array and passes the updated array to the provider

### Tool call → message format

When the model makes tool calls and the Engine loops back to the provider:

**Assistant message with tool_calls:**
```typescript
{
  role: "assistant",
  content: "",
  tool_calls: [
    { id: "tc_1", type: "function", function: { name: "memory_read", arguments: "{\"path\":\"notes.md\"}" } }
  ]
}
```

Note: `arguments` in the tool_calls message is a **JSON string**, not an object. Stringify the arguments object from the tool-call event.

**Tool result message (one per tool call):**
```typescript
{
  role: "tool",
  content: "<the output string or error string>",
  tool_call_id: "tc_1"
}
```

If the tool returned an `error`, use the error string as the content. If it returned `output`, use the output string.

---

## File 2: `src/engine/tool-executor.ts`

Export:

```typescript
export async function createToolExecutor(
  builtInExecutor: ToolExecutor,
  toolSources: string[],
): Promise<ToolExecutor>
```

### Behavior

**`createToolExecutor(builtInExecutor, toolSources)`**

Creates a combined `ToolExecutor` that merges built-in tools (memory tools from Phase 1A) with external tools discovered from `tool_sources` directories.

1. **Discover external tools:**
   - For each directory path in `toolSources`:
     - If the directory doesn't exist, skip silently
     - Read all immediate subdirectories
     - In each subdirectory, look for a `tool.json` file
     - If found, parse it as a `ToolDefinition`
     - If the JSON is malformed, skip silently (don't crash)
   - Collect all valid external tool definitions

2. **`listTools()`:**
   - Return the union of `builtInExecutor.listTools()` and all discovered external tool definitions

3. **`execute(name, arguments_)`:**
   - If the tool name matches a built-in tool (check `builtInExecutor.listTools()` names), route to `builtInExecutor.execute(name, arguments_)`
   - If the tool name matches an external tool, return `{ id: name, error: "External tool execution not implemented" }` (external execution is a Phase 3+ concern — for now, just register the definitions for discovery)
   - If the tool name matches nothing, return `{ id: name, error: "Unknown tool: <name>" }`

### Directory structure for external tools

```
tool_sources[0]/
  echo-tool/
    tool.json          ← ToolDefinition JSON
  weather-tool/
    tool.json          ← ToolDefinition JSON
tool_sources[1]/
  another-tool/
    tool.json
```

Each `tool.json` contains a JSON object matching the `ToolDefinition` schema:
```json
{
  "name": "test_echo",
  "description": "Echo tool for testing",
  "parameters": {
    "type": "object",
    "properties": {
      "text": { "type": "string", "description": "Text to echo" }
    },
    "required": ["text"]
  },
  "source": "external:test_echo",
  "category": "discoverable"
}
```

---

## Dependencies

You may use:
- `node:fs/promises` — reading tool.json manifests
- `node:path` — path resolution
- Types from `../types/index.js`

You must NOT import from:
- `../gateway/`
- `../auth/`
- `../adapters/` (Engine does not know about adapters — it receives a ProviderAdapter interface)

You MAY import from:
- `../memory/` — only type references, NOT implementation imports (the built-in executor is passed in, not constructed)

Do NOT add any npm dependencies. Use only built-in Node APIs.

---

## Constraints

1. **Zero imports from gateway/ or auth/** — the Engine is independent of both (D39, D60)
2. **Zero product-specific logic** — no BrainDrive references, no feature flags, no domain conditionals (D39)
3. **Stateless between chat() calls** — no mutable state that persists between calls to `chat()`
4. **Messages passthrough** — the Engine passes messages directly to the provider, never constructs or modifies prompts (D40)
5. **Tool results unmodified** — tool execution results are passed to the model exactly as returned (security requirement)
6. **Errors reported, not recovered** — the Engine reports tool failures to the model, does not retry or silently recover (security requirement)
7. **ESM imports, TypeScript strict mode**
8. **Use exact types from `src/types/index.ts`** — do not redefine or extend them

---

## How to Verify Your Work

```bash
npm run build
npm run check:imports
npm run check:lockin
npm run lint
```

All four must pass. The Engine directory (`src/engine/`) must contain zero imports from `gateway/` or `auth/`.
