# Phase 3: Gateway and Integration

## Before You Start

**Read these files first** (all paths relative to repo root):
- `src/types/index.ts` — all type definitions including `ConversationStore`, `Conversation`, `ConversationSummary`, `EngineEvent`, `EngineRequest`, `Message`
- `src/engine/index.ts` — `createEngine()` returns `{ chat(request: EngineRequest): AsyncIterable<EngineEvent> }`
- `src/auth/middleware.ts` — `createAuthMiddleware()` returns Hono middleware
- `src/auth/provider.ts` — `createV1AuthProvider()` returns `AuthProvider`
- `src/memory/tools.ts` — `createMemoryTools()` returns `MemoryTools`
- `src/memory/registry.ts` — `createMemoryToolExecutor()` returns `ToolExecutor`
- `src/adapters/mock.ts` — `createMockProvider()` for testing
- `src/config/boot.ts` — `boot()` function and `BootResult`
- `src/index.ts` — current public exports

**Files you will create:**
- `src/gateway/conversation-store.ts` — SQLite conversation store
- `src/gateway/index.ts` — Gateway core (`createGateway` + `sendMessage`)
- `src/gateway/routes.ts` — Hono HTTP routes
- `src/gateway/server.ts` — Full server composition (boot → compose → listen)

**Files you will modify:**
- `src/index.ts` — add Gateway exports

---

## Overview

Build the Gateway component and wire everything together. This is the first end-to-end moment: send a message, get a response. The Gateway manages conversations and routes to the Engine. It does NOT interpret content, execute tools, or authenticate.

Key architectural rules:
- Gateway calls `engine.chat()` directly as a function (in-process). The Engine is NOT exposed as a public HTTP route (D137).
- Gateway stores conversations via a dedicated conversation store tool (SQLite). It does NOT go through the Engine's tool loop for this (D152).
- Auth is middleware on the Hono app, not inside the Gateway (D60).
- Gateway is content-agnostic and interface-agnostic (D59).

---

## Deliverable 3.1: Conversation Store

**File:** `src/gateway/conversation-store.ts`

**Export:** `createConversationStore(dbPath: string): ConversationStore`

Implement the `ConversationStore` interface from `src/types/index.ts`:

```typescript
interface ConversationStore {
  create(): Promise<Conversation>;
  get(id: string): Promise<Conversation | null>;
  list(query?: { limit?: number; offset?: number }): Promise<ConversationSummary[]>;
  appendMessage(id: string, message: Message): Promise<void>;
}
```

Requirements:
- Use `better-sqlite3` (already a dependency).
- Database location: the `dbPath` argument (caller passes `{memory_root}/.data/conversations.db`).
- Create the `.data` directory and database file if they don't exist.
- Tables:
  - `conversations` — columns: `id` (TEXT PRIMARY KEY), `created_at` (TEXT), `updated_at` (TEXT)
  - `messages` — columns: `id` (INTEGER PRIMARY KEY AUTOINCREMENT), `conversation_id` (TEXT, FOREIGN KEY), `role` (TEXT), `content` (TEXT), `tool_calls` (TEXT, nullable JSON), `tool_call_id` (TEXT, nullable), `created_at` (TEXT)
- Generate conversation IDs with `crypto.randomUUID()`.
- `get()` returns the conversation with all messages in insertion order.
- `list()` returns summaries with `message_count` computed from the messages table. Order by `updated_at` descending. Support `limit` and `offset`.
- `appendMessage()` updates the conversation's `updated_at` timestamp.
- Store `tool_calls` as `JSON.stringify(message.tool_calls)` (nullable).
- Store `tool_call_id` as-is (nullable).

---

## Deliverable 3.2: Gateway Core

**File:** `src/gateway/index.ts`

**Export:** `createGateway(deps): Gateway`

```typescript
function createGateway(deps: {
  engine: { chat(request: EngineRequest): AsyncIterable<EngineEvent> };
  conversationStore: ConversationStore;
  systemPrompt?: string;
}): {
  sendMessage(request: {
    conversation_id?: string;
    message: Message;
    metadata?: Record<string, unknown>;
  }): AsyncIterable<EngineEvent & { conversation_id?: string }>;
}
```

`sendMessage` flow:
1. If `conversation_id` is provided, call `conversationStore.get(conversation_id)`. If null, throw an error (will become 404).
2. If no `conversation_id`, call `conversationStore.create()` to get a new conversation.
3. Append the user message: `conversationStore.appendMessage(id, request.message)`.
4. Assemble the messages array for the Engine:
   - If `systemPrompt` is set: `[{ role: "system", content: systemPrompt }, ...conversationHistory, request.message]`
   - If no `systemPrompt`: `[...conversationHistory, request.message]`
   - Conversation history = all existing messages from `conversationStore.get()`.
5. Build `EngineRequest`: `{ messages, metadata: { conversation_id: id, correlation_id: crypto.randomUUID(), ...request.metadata } }`
6. Call `engine.chat(engineRequest)`.
7. Yield all events from the engine stream to the caller while collecting text-delta content.
8. After the stream ends (done or error event received), persist the assistant message:
   - Concatenate all `text-delta` content into one string.
   - `conversationStore.appendMessage(id, { role: "assistant", content: fullText })`.
9. When yielding the `done` event, add `conversation_id` to the data.

Important:
- Gateway does NOT interpret, filter, or modify message content.
- Gateway does NOT execute tools — tool events pass through from engine.
- Gateway does NOT authenticate — that's middleware.
- Gateway does NOT construct prompts beyond the system prompt + history assembly.

---

## Deliverable 3.3: Gateway HTTP Routes

**File:** `src/gateway/routes.ts`

**Export:** `createGatewayRoutes(deps): Hono`

```typescript
function createGatewayRoutes(deps: {
  gateway: ReturnType<typeof createGateway>;
  conversationStore: ConversationStore;
}): Hono
```

Routes:

### `POST /conversations/messages` — New conversation + message
- Parse JSON body: `{ message: Message, metadata?: Record<string, unknown> }`
- Validate: `message` must exist and have `role` and `content`. Return 400 if invalid.
- Call `gateway.sendMessage({ message, metadata })`.
- Return SSE stream. Format each `EngineEvent` as:
  ```
  event: {event.type}
  data: {JSON.stringify(eventData)}

  ```
- Set `Content-Type: text/event-stream`.
- When yielding the `done` event, include `conversation_id` in the data.

### `POST /conversations/:id/messages` — Message to existing conversation
- Same as above but with `conversation_id` from URL parameter.
- If conversation not found (gateway throws), return 404 with `{ code: "not_found", message: "..." }`.

### `GET /conversations` — List conversations
- Call `conversationStore.list()`.
- Return JSON array of conversation summaries.

### `GET /conversations/:id` — Conversation history
- Call `conversationStore.get(id)`.
- If null, return 404.
- Return JSON conversation object.

**Error handling:**
- Catch JSON parse errors → 400.
- Catch missing/invalid message → 400.
- Catch conversation not found → 404.

---

## Deliverable 3.4: Server Composition

**File:** `src/gateway/server.ts`

**Export:** `createServer(config)` and `startServer(port?)`

```typescript
async function createServer(options: {
  config: RuntimeConfig;
  authToken: string;
  systemPrompt?: string;
}): Promise<Hono>

async function startServer(options?: {
  port?: number;
  configPath?: string;
}): Promise<void>
```

`createServer` composes the full Hono app:
1. Create memory tools from `config.memory_root`.
2. Create memory tool executor.
3. Create a mock provider (for now — real adapter loading will be wired later).
4. Create engine with provider + tool executor.
5. Create conversation store at `{config.memory_root}/.data/conversations.db`.
6. Create gateway with engine + conversation store + system prompt.
7. Create gateway routes.
8. Create auth provider from `authToken`.
9. Create auth middleware.
10. Compose Hono app:
    - `app.use("*", authMiddleware)`
    - `app.get("/health", (c) => c.json({ status: "ok" }))`
    - `app.route("/", gatewayRoutes)`
11. Return the composed app.

`startServer` is the standalone entry point:
1. Run boot sequence to get config.
2. Read auth token from `PAI_AUTH_TOKEN` env var or generate one.
3. Call `createServer`.
4. Use `@hono/node-server` or `Bun.serve` to listen on `127.0.0.1:{port}` (default 3000).
   - NOTE: If `@hono/node-server` is not available, use the Node.js `node:http` `createServer` approach with Hono's `fetch` handler. Bind to `127.0.0.1` only — NOT `0.0.0.0`.
5. Print startup message to stdout.

**Important:** The Engine is NOT exposed as a public HTTP route. Only gateway routes are mounted on the Hono app. Auth middleware wraps all routes.

---

## Deliverable 3.5: Update Public Exports

**File:** `src/index.ts` — add these exports:

```typescript
export { createConversationStore } from "./gateway/conversation-store.js";
export { createGateway } from "./gateway/index.js";
export { createGatewayRoutes } from "./gateway/routes.js";
export { createServer, startServer } from "./gateway/server.js";
```

---

## Tests That Must Pass

After implementation, these test files (already in the repo) must pass:

```bash
npx vitest run test/unit/conversation-store.test.ts --reporter=verbose
npx vitest run test/unit/gateway.test.ts --reporter=verbose
npx vitest run test/unit/gateway-boundary.test.ts --reporter=verbose
npx vitest run test/integration/gateway-http.test.ts --reporter=verbose
npx vitest run test/integration/e2e.test.ts --reporter=verbose
npx vitest run test/integration/deploy.test.ts --reporter=verbose
npx vitest run test/integration/boot-modes.test.ts --reporter=verbose
```

Plus all existing tests must continue to pass:
```bash
npx vitest run --reporter=verbose
```

---

## Verification Checklist

Before you finish, verify:
- [ ] `npm run build` compiles with zero errors
- [ ] `npx vitest run --reporter=verbose` — ALL tests pass (existing + new)
- [ ] `npm run check:imports` — zero cross-boundary imports
- [ ] No imports from `engine/` or `auth/` in `gateway/` source files (only from `types/`)
- [ ] No product-specific logic: `grep -rn "BrainDrive\|braindrive" src/gateway/` returns nothing
- [ ] Engine is NOT exposed as a public HTTP route
- [ ] Server binds to `127.0.0.1` (localhost), NOT `0.0.0.0`
