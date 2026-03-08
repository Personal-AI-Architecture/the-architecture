# Personal AI Architecture

**What:** Use any interface, any model, any tool. Even the system itself is swappable.

**Why:** You're never locked into anyone's system, and you can upgrade yours at the speed of AI.

A generic, user-owned AI runtime. Zero lock-in by design.

Four components (Your Memory, Engine, Auth, Gateway), two connectors (Gateway API, Provider API), three externals (Clients, Models, Tools). Every piece is swappable. Your data stays on your machine.

## What This Repository Is

This repository is both:

- A reference implementation of the Level 1 foundation architecture
- A validation suite that proves architectural promises (swappability, local-first operation, zero lock-in, clear boundaries)

It is not intended to be a full product application. The default validation path is mock-first and can run without external model services.

## Install

```bash
npm install personal-ai-architecture
```

## Quick Start

### As a dependency

```typescript
import {
  boot,
  createServer,
  createMemoryTools,
  createMemoryToolExecutor,
  createOpenAICompatibleAdapter,
  createEngine,
  createConversationStore,
  createGateway,
} from "personal-ai-architecture";

// Boot loads config, adapter, tools, and validates memory
const { config, adapterConfig } = await boot();

// Or compose manually
const memoryTools = createMemoryTools("/path/to/your/memory");
const toolExecutor = createMemoryToolExecutor(memoryTools);
const provider = createOpenAICompatibleAdapter({
  name: "openrouter",
  base_url: "https://openrouter.ai/api/v1",
  api_key: process.env.OPENROUTER_API_KEY!,
  default_model: "anthropic/claude-sonnet-4",
});
const engine = createEngine(provider, toolExecutor);
```

### Standalone

Create a `config.json`:

```json
{
  "memory_root": "/path/to/your/memory",
  "provider_adapter": "openrouter",
  "auth_mode": "local",
  "tool_sources": []
}
```

Set your API key and start:

```bash
export OPENROUTER_API_KEY=sk-or-v1-...
npx personal-ai
# optional sanity check:
npx personal-ai boot-check
```

## Validate Architecture (Mock-First, No API Key)

From this repository root:

```bash
npm install
npx tsx scripts/acceptance-check.ts
npm run test:conformance
npm test
```

What these validate:

- `acceptance-check.ts`: owner outcomes (swap provider, move memory, add tool) with mock providers
- `test:conformance`: architecture invariants and lock-in gate tests
- `npm test`: full suite (unit + integration + conformance)

The runtime boot path is intentionally lenient. If adapter config or API key is unavailable, the system falls back to mock/degraded mode so local validation still works.

## Validate With Real Providers (Optional)

Use this when you want to validate network model connectivity in addition to architecture behavior:

```bash
export OPENROUTER_API_KEY=sk-or-v1-...
npx tsx scripts/provider-check.ts
npx tsx scripts/server-check.ts
```

## Configuration

The runtime config has four fields:

| Field | Description |
|-------|-------------|
| `memory_root` | Path to your memory folder (files + SQLite conversations) |
| `provider_adapter` | Adapter name — matches `adapters/{name}.json` |
| `auth_mode` | `"local"` for V1 owner-only auth |
| `tool_sources` | Directories to scan for `tool.json` manifests |

Adapter configs live in `adapters/`. Two are included:

- **openrouter** — Works with any model via [OpenRouter](https://openrouter.ai)
- **ollama** — Local models via [Ollama](https://ollama.com)

Both use the OpenAI-compatible format, so any compatible endpoint works.

## Documentation

Full architecture documentation lives in [`docs/`](docs/):

- **[AGENT.md](AGENT.md)** — AI-friendly entry point: architecture overview, lock-in checks, conformance criteria
- **[docs/foundation-spec.md](docs/foundation-spec.md)** — Core architecture: components, contracts, principles, responsibility matrix
- **[docs/guides/implementers-reference.md](docs/guides/implementers-reference.md)** — Distilled implementation contract (what to build, no rationale)
- **[docs/guides/conformance/](docs/guides/conformance/)** — Architectural invariant test suite

## Architecture

```
Clients ──→ Gateway API ──→ Gateway ──→ Engine ──→ Provider API ──→ Models
                              │            │
                              │            └── Tools (discovered from tool_sources)
                              │
                              └── Your Memory (files + git + SQLite)
                                     │
                                     └── Auth (cross-cutting)
```

**Your Memory** is the platform. Files are plain text, conversations are SQLite, history is git. When the system isn't running, you can read and modify everything with standard tools.

**Engine** is a generic agent loop: message → model → tools → response → repeat. No opinions about what you build with it.

**Gateway** manages conversations, routes messages, serves HTTP. Any client that speaks the Gateway API works.

**Auth** is V1 owner-only. Token from `PAI_AUTH_TOKEN` env var or auto-generated at first boot (`{memory_root}/.data/auth-token`, mode 0600).

## Adding Tools

Drop a `tool.json` manifest into any directory listed in `tool_sources`:

```
my-memory/tools/weather/tool.json
```

```json
{
  "name": "get_weather",
  "description": "Get current weather for a city",
  "parameters": {
    "type": "object",
    "properties": {
      "city": { "type": "string" }
    },
    "required": ["city"]
  }
}
```

Restart and the tool is discovered alongside the built-in memory tools.

## Swapping Providers

Change `provider_adapter` in your config and set the corresponding API key. No code changes.

```bash
# OpenRouter (cloud models)
export OPENROUTER_API_KEY=sk-or-v1-...

# Ollama (local models)
# No API key needed — just run ollama serve
```

## Moving Your Memory

Copy the folder. Point config to the new location. Everything works — files, conversations, history.

```bash
cp -r ~/old-memory ~/new-memory
# Update config.json: "memory_root": "~/new-memory"
```

## Scripts

```bash
npx tsx scripts/server-check.ts      # Full server test with real model
npx tsx scripts/acceptance-check.ts  # 3 acceptance tests (no API key needed)
npx tsx scripts/engine-check.ts      # Engine loop verification
npx tsx scripts/memory-check.ts      # Memory tools verification
npx tsx scripts/auth-check.ts        # Auth verification
npx tsx scripts/provider-check.ts    # Provider connectivity test
```

## Testing

```bash
npm test                    # Full test suite (unit + integration + conformance)
npm run test:conformance    # Conformance suite + lock-in gate checks
npm run check:imports       # Import boundary verification
npm run check:lockin        # Zero lock-in grep check
npm run baseline            # Build + tests + lint + imports + lock-in + docs checks
```

## Writing Your Own Tests

Add tests under:

- `test/unit/` for component-level behavior
- `test/integration/` for end-to-end stack behavior
- `test/conformance/` for architecture contract/invariant checks

Run only your test file during development:

```bash
npx vitest run test/integration/my-feature.test.ts --reporter=verbose
```

Run a folder while iterating:

```bash
npx vitest run test/unit/ --reporter=verbose
```

When done, run:

```bash
npm test
```

## License

MIT
