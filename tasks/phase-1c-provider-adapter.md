# Phase 1C: Provider Adapter — Codex Task

## What You're Building

An OpenAI-compatible provider adapter that translates between the system's internal format and the OpenAI chat completions API format. This is what lets the system talk to any OpenAI-compatible model provider (OpenRouter, Ollama, etc.) without the Engine knowing the difference.

You are building **three things**:
1. `src/adapters/openai-compatible.ts` — the adapter that speaks OpenAI format
2. `src/adapters/mock.ts` — a mock provider for testing (no network calls)
3. `src/adapters/loader.ts` — loads adapter config from `adapters/{name}.json`

## Interfaces You Must Implement

All types are already defined in `src/types/index.ts`. Do not modify the type definitions.

### ProviderAdapter interface (from `src/types/index.ts`)

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

### Message and ToolDefinition

These come from the generated types. Messages have `role`, `content`, optional `tool_calls` and `tool_call_id`. ToolDefinitions have `name`, `description`, `parameters`.

---

## File 1: `src/adapters/openai-compatible.ts`

Export:

```typescript
export interface AdapterConfig {
  name: string;
  base_url: string;
  api_key: string;
  default_model: string;
}

export function createOpenAICompatibleAdapter(config: AdapterConfig): ProviderAdapter
```

### Behavior

**`complete(messages, tools)`**

1. **Translate messages** to OpenAI format:
   - Map `role` and `content` directly
   - Map `tool_calls` array: each entry becomes `{ id, type: "function", function: { name, arguments: JSON.stringify(arguments) } }`
   - Map `tool_call_id` for tool-role messages

2. **Translate tools** to OpenAI function calling format:
   - Each `ToolDefinition` becomes: `{ type: "function", function: { name, description, parameters } }`

3. **Make HTTP request** to `{base_url}/chat/completions`:
   - Method: POST
   - Headers: `Authorization: Bearer {api_key}`, `Content-Type: application/json`
   - Body: `{ model: config.default_model, messages, tools (if non-empty), stream: true }`

4. **Parse SSE response** and yield `ProviderEvent` objects:
   - `data: [DONE]` → yield `{ type: "finish", finish_reason: "stop" }`
   - `choices[0].delta.content` → yield `{ type: "text-delta", content }`
   - `choices[0].delta.tool_calls` → accumulate chunks, then yield `{ type: "tool-call", id, name, arguments }` when complete
   - `choices[0].finish_reason` → yield `{ type: "finish", finish_reason, usage }`
   - Tool call arguments arrive as streamed JSON chunks — accumulate them until the tool call is complete (signaled by a new tool call index or finish)

5. **Error handling** — translate HTTP errors to ProviderEvent errors:
   - 401 → yield `{ type: "error", code: "auth_error", message: "Invalid API key" }`
   - 429 → yield `{ type: "error", code: "rate_limit", message: "Rate limited by provider" }`
   - 502/503/504 → yield `{ type: "error", code: "provider_unavailable", message: "Provider is unavailable" }`
   - Network error → yield `{ type: "error", code: "network_error", message: "<details>" }`
   - Malformed SSE → yield `{ type: "error", code: "parse_error", message: "Malformed response from provider" }`

### SSE Parsing

The OpenAI SSE format sends lines like:
```
data: {"id":"...","choices":[{"delta":{"content":"Hello"},"index":0}]}

data: {"id":"...","choices":[{"delta":{"tool_calls":[{"index":0,"id":"call_123","function":{"name":"memory_read","arguments":""}}]},"index":0}]}

data: {"id":"...","choices":[{"delta":{"tool_calls":[{"index":0,"function":{"arguments":"{\"path\":"}}]},"index":0}]}

data: {"id":"...","choices":[{"delta":{"tool_calls":[{"index":0,"function":{"arguments":"\"notes.md\"}"}}]},"index":0}]}

data: {"id":"...","choices":[{"finish_reason":"tool_calls"}],"usage":{"prompt_tokens":100,"completion_tokens":50}}

data: [DONE]
```

Tool call arguments are streamed incrementally — you must buffer them and parse the complete JSON when the tool call is finished.

---

## File 2: `src/adapters/mock.ts`

Export:

```typescript
export interface MockScenario {
  events: ProviderEvent[];
}

export function createMockProvider(scenario: MockScenario): ProviderAdapter
```

### Behavior

- `complete()` yields the events from `scenario.events` in order
- Ignores the actual messages and tools — just replays the scenario
- Used for testing the Engine without network calls

Example scenarios the Engine tests will use:
```typescript
// Text response
{ events: [
  { type: "text-delta", content: "Hello " },
  { type: "text-delta", content: "world" },
  { type: "finish", finish_reason: "stop" }
]}

// Tool call
{ events: [
  { type: "tool-call", id: "call_1", name: "memory_read", arguments: { path: "notes.md" } },
  { type: "finish", finish_reason: "tool_calls" }
]}

// Error
{ events: [
  { type: "error", code: "provider_error", message: "Model unavailable" }
]}
```

---

## File 3: `src/adapters/loader.ts`

Export:

```typescript
export interface RawAdapterConfig {
  name: string;
  description: string;
  base_url: string;
  api_key_ref: string;
  format: string;
  default_model: string;
}

export async function loadAdapterConfig(adapterName: string): Promise<RawAdapterConfig>
export function resolveApiKey(config: RawAdapterConfig): string
```

### Behavior

**`loadAdapterConfig(adapterName)`**
- Read `adapters/{adapterName}.json` from the project root (resolve relative to the module)
- Parse JSON and return the config object
- If file not found: throw with clear error message
- If JSON invalid: throw with clear error message

**`resolveApiKey(config)`**
- If `config.api_key_ref` is empty string: return empty string (local providers like Ollama)
- Otherwise: read from `process.env[config.api_key_ref]`
- If env var not set: throw with clear error: `"API key not found: set ${config.api_key_ref} environment variable"`

---

## Dependencies

You may use:
- `node:fs/promises` — reading adapter config files
- `node:path` — path resolution
- Built-in `fetch` — HTTP requests (Node 20+)
- Types from `../types/index.js`

You must NOT import from:
- `../gateway/`
- `../engine/`
- `../auth/`
- `../memory/`

Do NOT add any npm dependencies. Use only built-in Node APIs.

---

## Constraints

1. Zero imports from gateway, engine, auth, or memory
2. No retry logic, caching, or routing in the adapter — pure translation (C-4)
3. No hardcoded provider URLs or model names in the adapter code — all from config
4. Use the exact types from `src/types/index.ts`
5. ESM imports, TypeScript strict mode
6. The adapter is stateless — no mutable state between `complete()` calls
7. Handle all SSE parsing edge cases: empty lines, `data: [DONE]`, malformed JSON

---

## How to Verify Your Work

```bash
npm run build
npm run check:imports
npm run check:lockin
npm run lint
```

All four must pass.
