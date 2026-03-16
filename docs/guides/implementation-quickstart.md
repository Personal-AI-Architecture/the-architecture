---
hide_table_of_contents: true
---

# Implementation Quickstart

> Build your own AI system on the Personal AI Architecture.
> This guide walks you through what you get, what you decide, and how to wire it up.
>
> **Time:** One developer with AI can have a working implementation in days, not months.

---

## What You Get

Install the foundation:

```bash
npm install personal-ai-architecture
```

This gives you working runtime code — not stubs, not types, not documentation. These are factory functions you call to create running components:

| Component | Factory Function | What It Does |
|-----------|-----------------|-------------|
| **Agent Loop** | `createEngine(provider, toolExecutor)` | Generic agent loop — sends messages to the model, executes tool calls, streams events back |
| **Your Memory Tools** | `createMemoryTools(root)` + `createMemoryToolExecutor(tools)` | 7 operations: read, write, edit, delete, search, list, history. Atomic writes, path sandboxing, git history. |
| **Model Adapter** | `createOpenAICompatibleAdapter(config)` | Streams any OpenAI-compatible API (OpenRouter, Ollama, any provider). Handles tool call buffering. |
| **Auth** | `createV1AuthProvider()` + `createAuthMiddleware()` | Middleware you configure on or off. Sits between Gateway and Agent Loop. |
| **Gateway** | `createGateway({ engine, conversationStore, systemPrompt })` | Conversation management, message routing, optional persistence. |
| **Conversation Store** | `createConversationStore(dbPath)` | SQLite-backed conversation persistence. Optional — you can manage messages yourself. |

See [Implementer's Reference](./implementers-reference.md) for full contracts and the responsibility matrix.

---

## Minimal Working Example

Wire up the foundation and send a message — ~20 lines:

```typescript
import {
  createEngine,
  createMemoryTools,
  createMemoryToolExecutor,
  createOpenAICompatibleAdapter,
} from "personal-ai-architecture";

const memoryTools = createMemoryTools("/path/to/library");
const toolExecutor = createMemoryToolExecutor(memoryTools);

const provider = createOpenAICompatibleAdapter({
  name: "my-provider",
  base_url: process.env.MODEL_URL,
  api_key: process.env.API_KEY,
  default_model: process.env.MODEL_NAME,
});

const engine = createEngine(provider, toolExecutor);

// Send a message — engine returns an async iterable of events
const messages = [
  { role: "system", content: "You are a helpful assistant. Use memory tools to manage files." },
  { role: "user", content: "Create a folder called finances with an overview document." },
];

for await (const event of engine.run(messages)) {
  if (event.type === "text-delta") process.stdout.write(event.content);
  if (event.type === "tool-call") console.log(`[tool] ${event.name}`);
  if (event.type === "error") console.error(event.message);
}
```

That's a working AI agent with memory. Everything after this is your implementation decisions.

---

## Decisions You Make

The architecture handles the plumbing. You decide the product. Here's every decision you'll face, roughly in the order you'll face them:

### 1. Client — What are people talking to?

The architecture doesn't care what your client is. It just needs to send messages and receive streamed events.

| Option | Examples |
|--------|---------|
| Terminal CLI | Readline REPL, like Claude Code |
| Web app | React, Vue, Svelte — talks to Gateway API |
| Mobile app | React Native, Swift, Kotlin |
| Bot | Discord, Slack, Telegram |
| Voice | Voice-to-text → agent → text-to-speech |
| Embedded | Inside VS Code, Obsidian, another tool |

**Out of the box:** The foundation includes a Gateway with HTTP routes (`createGatewayRoutes`, `createServer`) if your client talks HTTP. For terminal or embedded clients, you can call the Engine directly.

### 2. System Prompt — What does your agent do?

The system prompt is your product. It defines personality, rules, and behavior. The foundation accepts a `systemPrompt` string — you decide what it says.

**Questions to answer:**
- What domain does your agent serve? (life management, coding, research, business ops...)
- What should it do when the user first arrives?
- What rules govern its behavior? (write freely? ask first? stay in scope?)
- How should it use memory? (folder conventions, naming, what to persist)

**Out of the box:** No default system prompt. You must provide one.

### 3. Model — Which AI?

The adapter works with any OpenAI-compatible endpoint. You decide which.

| Option | Trade-off |
|--------|-----------|
| Cloud via OpenRouter | Best quality (SOTA models), requires API key, costs money |
| Local via Ollama | Full ownership, free, quality varies by model |
| Direct provider (OpenAI, Anthropic) | Single provider, may be simpler |
| Your own fine-tune | Maximum control, most work |

**Out of the box:** `createOpenAICompatibleAdapter` handles all of these. Just change the URL and model name.

### 4. Tools — What can the agent do beyond memory?

The foundation ships 7 memory tools. You'll likely want more.

| Type | Examples |
|------|---------|
| Git integration | Auto-commit on writes, version history |
| Approval gates | Intercept writes, ask the user before executing |
| Web/API access | Browse the web, call external APIs |
| Code execution | Run scripts, execute commands |
| Integrations | Email, calendar, Slack, Jira |
| Domain-specific | Database queries, file conversion, image generation |

**How to add tools:** Implement the `ToolExecutor` interface (two methods: `execute` and `listTools`). Wrap the foundation's memory tool executor to add your tools alongside:

```typescript
const memoryExecutor = createMemoryToolExecutor(memoryTools);

const myToolExecutor = {
  listTools: () => [
    ...memoryExecutor.listTools(),
    { name: "git_commit", description: "Commit changes to git", parameters: { ... } },
  ],
  async execute(name, args) {
    if (name === "git_commit") return myGitCommit(args);
    return memoryExecutor.execute(name, args);
  },
};

const engine = createEngine(provider, myToolExecutor);
```

**Out of the box:** 7 memory tools. Everything else is yours to add.

### 5. Write Approval — Does the agent ask before writing?

The foundation executes tools immediately. If you want approval, wrap the tool executor:

| Option | When |
|--------|------|
| No approval | Trust the agent, move fast (coding tools, internal systems) |
| Approve all writes | Safety-first (personal data, shared systems) |
| Selective | Approve unexpected actions, auto-approve explicit requests |

**Out of the box:** No approval — tools execute immediately. Wrap `ToolExecutor.execute()` to add it.

### 6. Memory Organization — How are files structured?

Your Memory is files on disk. You decide the structure.

| Option | Example |
|--------|---------|
| Flat folders | `library/finances/`, `library/fitness/` |
| Nested hierarchy | `library/life/finances/`, `library/work/projects/acme/` |
| Domain-specific | `library/patients/john-doe/`, `library/repos/my-app/` |
| Convention files | `AGENT.md` in every folder, `spec.md`, `plan.md` |

**Out of the box:** Memory tools work with any structure. You define conventions via your system prompt.

### 7. Conversation Persistence — Do chats survive restarts?

| Option | When |
|--------|------|
| Ephemeral (in-memory) | Terminal CLI, simplicity, MVP-stage |
| SQLite via Gateway | Web app, multi-session, production |
| Custom storage | Postgres, cloud database, etc. |

**Out of the box:** `createConversationStore(dbPath)` gives you SQLite persistence. Or manage messages in your own array for ephemeral.

### 8. Hosting — Where does it run?

| Option | When |
|--------|------|
| Docker | Portable, reproducible, easy distribution |
| Native install | Better performance, no Docker dependency |
| Cloud / managed | For non-technical users, SaaS model |
| Embedded | Inside another application |

**Out of the box:** The foundation is a Node.js package. How you deploy is up to you.

### 9. Auth — Who can access it?

| Option | When |
|--------|------|
| Off (OS login is the boundary) | Local-only, single user, terminal |
| On (owner-only) | Web interface, exposed ports |
| Multi-user | Shared systems, managed hosting |

**Out of the box:** `createAuthMiddleware()` + `createV1AuthProvider()`. Configure on or off.

---

## Build Order

Recommended phases for a new implementation:

### Phase 0: Validate (~1-2 days)
Wire up the foundation in a test script. Send messages, execute tools, verify files persist. Test your system prompt against a live model. If the core loop doesn't work with good prompts, fix the prompt before building anything.

### Phase 1: Build Your Client (~1 week)
Build the interface — whatever your client is (terminal, web, mobile, bot). Wire it to the Engine or Gateway. Add your implementation-specific tools (git, approval, etc.). After this phase, you can interact with the agent through your client.

### Phase 2: Your Product (~1 week)
This is where your implementation becomes a product. Write the system prompt. Define memory conventions. Build the workflows that make your tool useful. Test with real scenarios.

### Phase 3: Package and Ship (~1 week)
Containerize or package for distribution. Handle edge cases. Write documentation. Ship.

**Total: ~2.5-3 weeks** for one developer with AI assistance.

---

## What You Can Change Later

Everything is swappable — that's the architecture's guarantee. But some things are easier to change than others:

| Easy to change anytime | Think about upfront |
|----------------------|-------------------|
| Model provider (just change config) | Client type (terminal vs web is a big pivot) |
| System prompt (iterate freely) | Memory organization (migration is possible but annoying) |
| Add/remove tools | Auth model (adding auth later is fine; removing is hard) |
| Hosting (Docker ↔ native ↔ cloud) | |
| Conversation persistence (add later) | |

---

## Reference

| Document | What It Covers |
|----------|---------------|
| [Implementer's Reference](./implementers-reference.md) | Full component contracts, responsibility matrix, API shapes |
| [Foundation Spec](../foundation-spec.md) | Architecture principles, design rationale |
| [Configuration Spec](../configuration-spec.md) | Config system details |
| [Customization Spec](../customization-spec.md) | How implementations extend the architecture |
| Component specs ([Memory](../memory-spec.md), [Engine](../engine-spec.md), [Auth](../auth-spec.md), [Gateway](../gateway-spec.md)) | Deep dive on each component |
