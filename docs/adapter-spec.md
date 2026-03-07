---
hide_table_of_contents: true
---

# Adapter Spec: Making Contracts Swappable

## How we define adapters

You own the internal interface your system speaks. That's what adapters are about.

Every AI system depends on external standards — OpenAI format, Anthropic format, provider-specific APIs, streaming conventions. You don't control those standards. They change when someone else decides they change. Without a boundary between you and them, your entire system is coupled to decisions you didn't make.

Adapters are that boundary. They are thin translation layers — one small file each — that sit between your components and the external world. Your components speak a stable internal interface that you define and control. The adapter translates to and from whatever external standard is current. When the standard changes, you swap the adapter. Nothing else moves.

This does three things:

1. **Decouples you from external standards you don't control.** OpenAI changes their format? Anthropic introduces a new streaming convention? Swap the adapter. Your components never knew the difference.

2. **Decouples you from your own internal choices.** The internal interface isn't sacred either — you own it, you can change it whenever you want. The adapter means the architecture doesn't become its own lock-in. You're not trading one dependency for another.

3. **Lets you adopt the best available standard without maintaining one yourself.** Why invent your own protocol when someone else has already built the tooling, the ecosystem, the documentation, the compatibility? Just use theirs. The adapter resolves the tension: ride the best standard available — you don't maintain it, you don't build it — without coupling to it. You get the ecosystem benefits without the lock-in cost.

This is simple to own, simple to control, and simple to change. An adapter is a stateless translation function, not a framework. One file, one job: translate.

> **Level 1 (Foundation):** Adapters are an implementation pattern within the existing connectors — they don't add new components or contracts.

```
WITHOUT ADAPTERS:
  Client ──[external format]──→ Gateway ──[external format]──→ Engine ──[external format]──→ Model
  │                                                                                      │
  └── locked to standard ───────────────────────────────────────────── locked to standard─┘

WITH ADAPTERS:
  Client ──→ Gateway API Adapter ──→ Gateway ──→ Engine ──→ Provider API Adapter ──→ Model
             │                       │           │          │
             translates              speaks      speaks     translates
             external ↔ internal     internal    internal   internal ↔ external
```

---

## Two Adapters

### Gateway API Adapter — Between Clients and Gateway

**External standard (today):** OpenAI Chat Completions format with product convention for client metadata.

**Internal interface:** Message in, response out. The Gateway receives a normalized request (messages, conversation ID, metadata) and returns a normalized response stream. It doesn't know or care what protocol the client spoke.

**What the adapter does:**
- Translates inbound client requests from the external standard into the internal interface
- Translates outbound Gateway responses from the internal interface into the external standard
- This is the only place the external protocol lives

**Swap scenario:** A new standard supersedes OpenAI Chat Completions. Write a new adapter that translates the new format to/from the same internal interface. Gateway doesn't change. Auth doesn't change. Engine doesn't change. Clients adopt the new standard at their own pace (or you run both adapters during transition).

### Provider API Adapter — Between Engine and Models

**External standard (today):** Provider-specific formats (OpenAI, Anthropic, OpenRouter — all variations on prompt + tool definitions in, completion + tool calls out).

**Internal interface:** Prompt in, completion out. The Engine sends a normalized request (system instructions, messages, tool definitions, context) and receives a normalized response stream (text, tool calls, done). It doesn't know what model or provider is behind the adapter.

**What the adapter does:**
- Translates outbound Engine requests from the internal interface into the provider's format
- Translates inbound model responses from the provider's format into the internal interface
- Handles provider-specific details (auth headers, streaming formats, tool call schemas)

**Swap scenario:** Switch from OpenRouter to a direct Anthropic integration, or to a local Ollama instance. Write (or select) an adapter for the new provider. Engine doesn't change. Gateway doesn't change. Your Memory doesn't change.

**Note:** Provider adapters are the more common swap — this is what happens every time you change model providers. The Gateway API adapter is the rare swap — it only changes if the industry standard shifts.

---

## How Model Configuration Works in Practice

The architecture works with any model out of the box — cloud, local, future. You set which model to use in configuration. The system uses that model for everything. When you want a different model, you change the configuration. That's it.

Three pieces of config control this:

**1. Runtime config** tells the system which adapter to use:
```json
{ "provider_adapter": "openrouter" }
```

**2. Adapter config** tells the adapter how to reach the provider:
```json
// adapters/openrouter.json
{
  "base_url": "https://openrouter.ai/api/v1",
  "api_key_ref": "$OPENROUTER_API_KEY"
}
```

**3. Your preference** (in Your Memory) tells the system which model you want:
```
"I prefer anthropic/claude-sonnet-4-6 via OpenRouter"
```

At boot, the system loads the adapter, reads your preference, and every request flows through the same path: Engine → Provider API Adapter → model. Your client doesn't need to know which model is behind the system — it sends messages to the Gateway API and gets responses back.

### Two kinds of change

**Same provider, different model** — change your model preference in Your Memory. One change, immediate effect.

| Before | After | What changed |
|--------|-------|-------------|
| Preference: `claude-sonnet-4-6` | Preference: `claude-opus-4-6` | One preference in Your Memory |

**Different provider** — change `provider_adapter` in runtime config and provide the new adapter config. Two changes, still config-only, zero code.

| Before | After | What changed |
|--------|-------|-------------|
| `provider_adapter: "openrouter"` | `provider_adapter: "ollama"` | Runtime config (1 field) |
| `adapters/openrouter.json` | `adapters/ollama.json` | Adapter config (1 file) |
| `$OPENROUTER_API_KEY` | *(not needed — Ollama is local)* | Environment variable |

In both cases: Engine doesn't change. Gateway doesn't change. Auth doesn't change. Your Memory doesn't change (except the preference). Your client doesn't change. This is the D147 anti-lock-in test — if any swap requires code changes, lock-in has been introduced.

See `configuration-spec.md` for runtime config details, boot sequence, and the full anti-lock-in test.

---

## The Discipline

The test: can you describe what the adapter does in one sentence? "Translates OpenAI Chat Completions format to the internal message interface." If the sentence needs an "and," the adapter is doing too much. The logic belongs in the component, not the adapter.

---

## Freedom, Not Enforcement

Nothing stops you from bypassing adapters, hardcoding a provider, or coupling components directly. The system still works. But every violation is a lock-in you've chosen to accept.

This is by design. Pillar 3 — Freedom — means you're free to use the system however you please. Enforcing the architecture would mean the platform telling you what you can and can't do with your own system. That's what Big Tech does. Instead, the architecture makes the zero-lock-in path the easiest path — not the only path. The choice is yours.

## Completing the Swappability Story

Before adapters, the architecture had an implicit hierarchy:

| Thing | Swappable via | Swap cost |
|-------|--------------|-----------|
| Your Memory storage | Tools | Zero — tools absorb it |
| Components | Contracts | One component swap |
| Contracts | ??? | Both sides must change |

With adapters:

| Thing | Swappable via | Swap cost |
|-------|--------------|-----------|
| Your Memory storage | Tools | Zero — tools absorb it |
| Components | Contracts | One component swap |
| Contracts | Adapters | One adapter swap |

Everything has an intermediary. No exceptions. The architecture's zero-lock-in promise is now structurally complete:

- **Your Memory** → swappable via tools (data behind an intermediary)
- **Components** → swappable via contracts (services behind an interface)
- **Contracts** → swappable via adapters (standards behind a translator)
- **Auth** → swappable via cross-cutting independence (no coupling to swap away)

---

## Architectural Impact

This does not change the component count, connector count, or external dependency count. The architecture remains: 4 components, 2 connectors, 3 externals.

Adapters are implementation details within the existing connectors — they define *how* the connector translates, not *what* the connector is. The Gateway API is still the Gateway API. The Provider API is still the Provider API. The adapter is the mechanism that lets those contracts point at different standards over time.

This also aligns with existing practice. Existing AI SDKs already work this way — they define a generic interface and provide adapters for multiple providers. We're recognizing a pattern that's already proven, not inventing something new.

---

**Related documents:** `foundation-spec.md` (architecture overview, links to all component specs)

---

## Decisions Made

| # | Decision | Rationale |
|---|----------|-----------|
| D139 | Contracts are swappable via adapters — completing the zero-lock-in architecture | Components are swappable through contracts, but contracts bind to a specific standard. Adapters absorb the standard: components speak an internal interface, adapters translate to/from the external standard. Swap the standard → swap the adapter → nothing else changes. Completes the chain: Your Memory via tools, Components via contracts, Contracts via adapters. |

---

## Changelog

| Date | Change | Reason | Source | Decision |
|------|--------|--------|--------|----------|
| 2026-03-01 | Cross-doc consistency: genericized Vercel AI SDK reference in Architectural Impact — replaced with "Existing AI SDKs" (Level 1 spec, no product-specific SDK recommendations). | Cross-doc review (Dave W + Claude) | — |
| 2026-03-01 | Added "How Model Configuration Works in Practice" section | Practical walkthrough of model/provider config and swaps — what to set, what changes for each swap type. Cross-references added to foundation-spec, models-spec, configuration-spec, implementers-reference. | Dave W + Claude | — |
| 2026-02-27 | Opener reframe + trim | Consistency with other specs: "How we define adapters" opener, collapsed related docs, added Level 1 note | Reorder + trim pass (Dave W + Claude) | — |
| 2026-02-27 | Initial spec created | Architecture discussion | Dave W + Claude | D139 |

---

*You own the internal interface. You control what changes and when. You ride the best available standards without coupling to them. Adapters are how the architecture delivers on that promise — simple to own, simple to control, simple to change.*
