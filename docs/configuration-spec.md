---
hide_table_of_contents: true
---

# Configuration: The Thin Bootstrap

## How we define configuration

Every system has configuration — Docker Compose files, .env files, settings.json, config.yaml. Every AI system has settings for which model to use, what tools are available, how to connect to services. So what's different here?

In most systems, configuration is a grab bag. User preferences, server addresses, API keys, feature flags, tool definitions, behavioral settings — all dumped into the same place. Move to a new environment and half of it breaks. Change a provider and you're editing files across the system. Configuration becomes a quiet source of lock-in that nobody notices until they try to leave.

Here, configuration is split by what it actually is. **Preferences are personal data — they live in Your Memory and travel with you. Runtime config is a thin bootstrap — it tells the system what's here, not what you want. Tools describe themselves — you don't write their definitions, they do.** Three categories, each with a natural home. Nothing bleeds across.

Why this matters: configuration is where lock-in hides. The architecture promises zero lock-in at every level — components via contracts, contracts via adapters, Your Memory via tools. But if swapping a provider means editing five config files across the system, the architecture's promise is hollow. Configuration must be as swappable as everything else. The anti-lock-in principle applies here: **if a normal swap requires more than one config change, you've introduced lock-in.**

This is a **Level 1 (Foundation) document** — it defines how configuration works at the generic, unopinionated level. Product-specific defaults (which provider, which tools ship, what starter content) are Level 2 (Product) opinions.

**Related documents:** `foundation-spec.md` (architecture overview, links to all component specs)

---

## The Three Categories

Configuration looks like one thing but is actually three things, each with a different owner and a different home.

### 1. Preferences — what you want

Your choices about how the system behaves. These are personal data. They describe you, not the environment.

| Example | Why it's a preference |
|---------|----------------------|
| "Always load git and filesystem tools" (D109 always-send set) | Your workflow — meaningful anywhere |
| "I prefer Claude via OpenRouter" | Your model choice — honored wherever possible |
| "Require approval before writing files" | Your policy — travels with you |
| "Verbose logging" | Your preference — not environment-specific |
| "Allow web scraper, deny system access tools" | Your tool policy — about how you work |

**Where they live:** Your Memory. They're data about you — no different from your documents, skills, or decisions. When you move to a new system, your preferences travel. The new environment tries to honor them. If it can't (tool not available, model not supported), the system tells you.

**What format:** Files in Your Memory. A config file in your library (e.g., `config/preferences.md` or `config/preferences.json`) — human-readable, editable, portable. The format is a Level 2 decision. The principle is Level 1: preferences are personal data.

### 2. Runtime config — what's here

The thin bootstrap that tells the system what exists in this environment. Four fields. This is the "desk setup" — it describes the desk, not the person sitting at it.

| Field | What it is | Example |
|-------|-----------|---------|
| `memory_root` | Where Your Memory lives on this system | `./your-memory` |
| `provider_adapter` | Which adapter connects to AI models | `openai-compatible` (generic default — works with OpenRouter, Ollama, OpenAI, Anthropic). Level 2 products may ship a specific adapter (e.g., BrainDrive ships `openrouter`). |
| `auth_mode` | How authentication works in this deployment | `local` (Level 1 default). Level 2 products may define additional modes (e.g., `managed`). |
| `tool_sources` | Where the system finds installed tools | `["./tools/", "/usr/local/mcp-servers/"]` |

`model_default` is intentionally not here — which model to use is a preference (Level 2 product default or Level 3 owner choice), not an environment fact. It lives in preferences or adapter config.

**Example runtime config:**

```json
{
  "memory_root": "./your-memory",
  "provider_adapter": "openai-compatible",
  "auth_mode": "local",
  "tool_sources": ["./tools/"]
}
```

**Where it lives:** With the deployment, not in Your Memory. A single file at a well-known path (e.g., `config.json` in the system root, or an environment variable pointing to it). When you move to a new system, the new system provides its own runtime config. You never carry it.

**Why it's thin:** Every field that goes in runtime config is a field that can't travel with you. The thinner this file is, the less environment-specific your system becomes. Four fields is enough to bootstrap. Everything else is either a preference (in Your Memory) or discovered from the environment.

### 3. Tool self-description — what tools can do

Tool definitions (name, description, parameters, capabilities) are not written by the owner or stored in config. **Tools describe themselves.**

| Mechanism | How it works | Example |
|-----------|-------------|---------|
| **MCP discovery** | Engine connects to an MCP server and asks "what can you do?" | Filesystem tools, custom MCP servers |
| **Manifest file** | Tool ships with a JSON manifest describing its capabilities | CLI tool wrappers, native functions |
| **Built-in** | Definition is part of the Engine or tool code | Approval gate, audit |

**Where definitions live:** With the tools. An MCP server knows its own tools. A CLI wrapper ships with a `tool.json`. A native function is defined in code. The Engine reads these at startup from the locations specified in `tool_sources`.

**Why this matters:** Nobody manually writes "git tool: takes command and args parameters, returns stdout." The tool says that about itself. This means adding a tool is: install it, point `tool_sources` at it, done. No config editing beyond that. No definition to maintain. No drift between what the config says and what the tool actually does.

---

## What Configuration Does NOT Do

| Anti-pattern | Why it's wrong | What to do instead |
|-------------|---------------|-------------------|
| Store tool definitions in config | Duplicates what the tool already knows about itself. Creates drift. | Let tools self-describe. Config just points to where tools are. |
| Store owner preferences in runtime config | Preferences are personal data. Putting them in runtime config means they don't travel with you. | Put preferences in Your Memory. |
| Store secrets in tracked config or Memory files | Secrets in tracked files get committed, shared, leaked. | Use environment variables or a `.env` file (gitignored). Config references secrets by name (`$OPENROUTER_API_KEY`), never by value. |
| Require config changes for normal operations | If using a new tool or starting a new project requires editing config, the system is too rigid. | Normal operations flow through Your Memory and tools. Config only changes when the environment changes. |
| Couple config to a specific implementation | Config that references internal service names, proprietary formats, or implementation details creates lock-in. | Config fields must be generic. `provider_adapter: "openrouter"` not `openrouter_v2_internal_bridge: true`. |

---

## Layered Overrides (D110)

Configuration follows the three-level model. Each level can override the one below it. Last layer wins.

| Layer | What it provides | Example |
|-------|-----------------|---------|
| **Level 1 — Foundation defaults** | Sensible defaults that make the system work out of the box | `auth_mode: "local"`, no tools pre-configured |
| **Level 2 — Product defaults** | Opinionated defaults from the product built on the foundation | BrainDrive sets `provider_adapter: "openrouter"`, ships starter tools, sets `model_default` |
| **Level 3 — Owner overrides** | The owner's choices, always final | Owner changes model, adds tools, sets policies |

**Merge order is deterministic:** Level 1 → Level 2 → Level 3. A Level 3 override always wins. A Level 2 default applies unless the owner overrides it. A Level 1 default applies unless the product or owner overrides it.

**One exception: environment safety constraints always win.** A Level 2 product may enforce security boundaries (D23) — tool allow lists, network restrictions, auth requirements — that override owner preferences. The full precedence chain:

> **Environment safety constraints (Level 2 product-enforced)** > **Owner preferences (Level 3)** > **Product defaults (Level 2)** > **Foundation defaults (Level 1)**

An owner can override a product default. An owner cannot override a product-enforced safety constraint. On local deployment at Level 1, the owner is the final authority — there are no provider-enforced constraints.

**Preferences use the same layering:** Level 1 has no preferences (the foundation is unopinionated). Level 2 ships product defaults ("require approval for writes"). Level 3 is the owner's choices ("don't require approval, I trust the model"). Preferences merge the same way — owner wins, safety constraints aside.

This means a product built on the foundation (like BrainDrive) ships with opinions that the owner can always override. The foundation itself ships with no opinions — just the mechanism.

---

## Secrets

Secrets (API keys, tokens, credentials) never appear in Your Memory or tracked config files.

| Principle | Detail |
|-----------|--------|
| **Reference, never value** | Config refers to secrets by name: `$OPENROUTER_API_KEY`. The value comes from the environment (env var, secret store, or Level 2 platform). |
| **Never in Your Memory** | Your Memory is portable, shareable, git-committed. Secrets in Your Memory are secrets leaked. |
| **Never in runtime config** | Runtime config may be shared across deployments or checked into a repo. |
| **Level 2 products may provide secrets** | A managed hosting product (Level 2) may supply API keys on behalf of the owner. |
| **Local deployment: owner's responsibility** | On local (Level 1), the owner sets env vars or uses a `.env` file (gitignored). Standard practice. |

---

## Adapter Config

Each adapter (see `adapter-spec.md`, D139) may have its own config file. This is where provider-specific settings live — not in runtime config, not in preferences.

| Adapter | What its config contains | Example |
|---------|------------------------|---------|
| **OpenRouter adapter** | Base URL, supported models list, rate limits | `adapters/openrouter.json` |
| **Anthropic direct adapter** | API version, model IDs, token limits | `adapters/anthropic.json` |
| **Ollama adapter** | Local server URL, available models | `adapters/ollama.json` |

**Example adapter config** (`adapters/openrouter.json`):

```json
{
  "base_url": "https://openrouter.ai/api/v1",
  "models": ["anthropic/claude-sonnet-4-6", "google/gemini-2.5-pro"],
  "api_key_ref": "$OPENROUTER_API_KEY"
}
```

**Swapping a provider = swapping an adapter file.** Runtime config points to which adapter (`provider_adapter: "openrouter"`). The adapter file contains everything provider-specific. Nothing else in the system knows or cares about provider details. See `adapter-spec.md` §How Model Configuration Works in Practice for the full walkthrough of model and provider swaps — what changes, what doesn't, and the two kinds of change (same provider vs different provider).

This is the same pattern as the architecture's contracts: components speak a generic internal interface, adapters translate to/from the specific external standard. Configuration follows the same principle: runtime config speaks generically, adapter config handles the specifics.

---

## How the System Boots

At startup, the system reads configuration in a strict sequence. Each phase depends only on the previous phase — no circular dependencies.

1. **Load runtime config** — find the config file (well-known path or env var), read the four fields. Now the system knows: where's Your Memory, which adapter, what auth mode, where are tools.
2. **Load adapter config** — load the adapter file specified by `provider_adapter`. Now the system knows how to connect to models.
3. **Discover tools** — scan `tool_sources` paths. For each tool found: MCP servers announce their tools via protocol, manifest files are read, built-in tools are loaded from code. Now the system knows what tools are available.
4. **Mount Your Memory** — use `memory_root` to locate Your Memory on the filesystem. At this point Your Memory is accessible but no preferences have been read yet.
5. **Read preferences** — read the preferences file from Your Memory (direct file read, not through the Engine — no tools required). Apply preference filters: always-send set, tool policies, approval requirements, model choice.
6. **Ready** — the Engine has tools, a provider, and preferences. The Gateway starts accepting connections (see `gateway-engine-contract.md` for request flow).

**Phases 1-3 are environment.** They happen before Your Memory is involved. They describe the desk.
**Phase 4-5 are personal.** They read from Your Memory. They describe you.
**Phase 6 is operation.** The system is live.

Note: Phase 5 reads preferences as a direct file read from `memory_root`, not through Engine tool calls. This avoids circularity — the Engine isn't running yet, so it can't call tools to read preferences that configure which tools it should load. Preferences are just a file at a known path within Your Memory.

If any preference references a tool that doesn't exist in this environment (e.g., "always load web scraper" but no web scraper is installed), the system notes the mismatch and continues. The model will tell the owner "web scraper is configured as preferred but not available in this environment" when relevant. This is not an error — it's information.

---

## The Anti-Lock-In Test (D147)

**A normal swap must succeed with config-only changes — zero code edits.**

Three swap types constitute "normal":

| Swap | What changes | Config changes required |
|------|-------------|----------------------|
| **Provider swap** | OpenRouter → Anthropic direct (or Ollama) | 1. `provider_adapter` in runtime config. 2. New adapter config file. 3. API key env var. |
| **Model swap** (within adapter) | Claude → Gemini (both on OpenRouter) | 1. Model preference in Your Memory (or adapter's model list). |
| **Tool swap** | Add/remove a tool | 1. Install/uninstall the tool in a `tool_sources` path. 2. Update preferences if it was in always-send set. |

**The test, concretely (CI-ready):**

1. Start the system with provider A (e.g., OpenRouter)
2. Run a standard conversation + tool-call test suite — verify pass
3. Change `provider_adapter` to provider B, provide adapter config, set env var
4. Run the same test suite — verify pass
5. **If any code change was required between steps 2 and 4, the test fails.** Lock-in has been introduced.

This is a CI test, not a guideline. It makes the principle enforceable. Run it on every release.

---

## Configuration and Your Memory: The Line

**One question: is this about you, or about this desk?**

- "I prefer Claude" → about you → Your Memory
- "Claude is available at this API endpoint" → about this desk → runtime/adapter config
- "Always load git tools" → about you → Your Memory
- "Git tools are installed at /usr/local/bin/git" → about this desk → tool self-description
- "Require approval for writes" → about you → Your Memory
- "Auth uses local mode" → about this desk → runtime config
- "sk-abc123..." → a secret → env var, never written anywhere

**Your Memory stays clean of environment-specific references.** When you move, your preferences come with you. The new environment provides its own runtime config, its own adapter config, its own installed tools. The system matches your preferences against what's available and tells you about any gaps.

---

## Decisions Made

| # | Decision | Rationale |
|---|----------|-----------|
| D143 | Configuration is a cross-cutting concern — not owned by any single component, defined in its own spec | Every component has configuration. Burying it in the engine spec understates its importance and its lock-in risk. Same pattern as tools (not a component, but important enough for its own spec) and security (cross-cutting, peer to auth). |
| D144 | Runtime config is a thin bootstrap — four fields, one file, describes the environment not the owner | Every field in runtime config is a field that can't travel with you. Thinner = more portable. Four fields is enough to bootstrap: where's Your Memory, which adapter, what auth mode, where are tools. Model choice is a preference, not an environment fact. Everything else is either a preference (in Your Memory) or discovered from the environment. |
| D145 | Preferences live in Your Memory — they're personal data, not environment configuration | "Always load git tools" is about how you work, not about this desk. Preferences travel with you. The new environment tries to honor them. If it can't, it tells you. This is what makes local ↔ managed hosting migration real. |
| D146 | Tools self-describe — config points to tool sources, not tool definitions | Tool definitions come from the tools themselves (MCP discovery, manifest files, code). Config only says where to find tools. This prevents drift between what config says and what tools actually do, and means adding a tool is install + point, not install + write definition + update config. |
| D147 | Anti-lock-in test: three normal swaps (provider, model, tool) must succeed with config-only changes | Provider swap = change adapter + env var. Model swap = change preference. Tool swap = install/uninstall + update preferences. If any requires code changes, lock-in has been introduced. CI-testable on every release. |
| D141-refined | D141 scope narrowed: only plumbing is excluded from Your Memory, not preferences | The original D141 moved all tool config out of Your Memory. The interview revealed that preferences (always-send set, tool policies, model choices) are personal data — they should be in Your Memory. Only plumbing (server addresses, ports, API keys) belongs in environment config. Tool definitions belong to the tools themselves, not to either place. |

---

## Open Questions

### ~~OQ-1: Preference file format~~ — DEFERRED to Level 2

**Resolution:** Level 2 product decision. The foundation requires "human-readable file in Your Memory" — the specific format (JSON, YAML, Markdown) is a product opinion.

### ~~OQ-2: Tool manifest convention~~ — DEFERRED to implementation

**Resolution:** Owned by `tools-spec.md`. Tools self-describe via MCP protocol, manifest files, or built-in definitions (D146). The manifest convention is a tools implementation detail, not a configuration concern.

### ~~OQ-3: Runtime config location convention~~ — DEFERRED to implementation

**Resolution:** Implementation decision. The foundation requires a single config file at a well-known path or pointed to by an environment variable. The specific convention is chosen during the build phase.

---

## Success Criteria

- [ ] Swapping a model provider requires only changing `provider_adapter` and providing a new adapter config file — zero code changes
- [ ] Swapping the Engine requires only changing the Engine binary/container — runtime config, preferences, and Your Memory are unaffected
- [ ] Adding a tool requires only installing it in a `tool_sources` path — the tool self-describes, no config editing beyond that
- [ ] Moving Your Memory to a new system works: preferences travel, runtime config is provided by the new environment, tool mismatches are reported not errors
- [ ] Secrets never appear in Your Memory or tracked config files
- [ ] Runtime config has four or fewer fields
- [ ] An AI agent can read and understand every config file without documentation

---

## Security Requirements

Per-component requirements from `security-spec.md`. Security-spec owns the "why"; this section owns the "what" for Configuration.

- [ ] Secrets (API keys, tokens, credentials) must never be stored in Your Memory or tracked config files — environment variables or gitignored `.env` files only
- [ ] Runtime config must not contain secrets by value — only references (`$OPENROUTER_API_KEY`)
- [ ] Preferences in Your Memory must not contain environment-specific references (server addresses, ports, paths) — only personal choices
- [ ] Adapter config files must not leak across deployments — provider-specific settings stay with the deployment, not with Your Memory
- [ ] The boot sequence must not require network access — Phases 1-5 complete without any outbound calls

---

## Changelog

| Date | Change | Source |
|------|--------|--------|
| 2026-03-01 | "No users, only owners" language pass: user → owner in 4 places | Ownership model alignment (Dave W + Claude) |
| 2026-03-01 | Cross-spec alignment review: fixed secrets wording (tracked files, not "any file"), removed Impact on D141 section (absorbed by Decisions table), deferred 3 OQs (Level 2 / implementation / tools-spec), added Security Requirements section, named D147 in Anti-Lock-In Test, added gateway-engine-contract cross-reference to boot sequence, conciseness pass (cut repeated desk metaphor, bridge sentences). | Cross-spec review (Dave W + Claude) |
| 2026-02-27 | Tightening pass: (1) precedence chain added — safety constraints > owner > product > foundation, (2) model_default moved to preferences (4 fields not 5), (3) boot sequence circularity fixed — 6 explicit phases, preferences read as direct file read, (4) JSON schema examples added for runtime + adapter config, (5) anti-lock-in test tightened — 3 defined swap types with CI steps, (6) cross-links verified | Dave W + Claude |
| 2026-02-27 | Initial configuration spec created from interview — three categories (preferences, runtime config, tool self-description), layered overrides, anti-lock-in test, D141 refinement | Configuration interview session (Dave W + Claude) |

---

*Configuration is where lock-in hides. The architecture promises zero lock-in at every level — but if configuration quietly introduces dependencies, proprietary formats, or environment coupling, the promise is hollow. This spec exists to make sure the desk setup is as simple and swappable as everything else.*
