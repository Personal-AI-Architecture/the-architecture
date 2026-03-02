# Documentation Maintenance Spec

> **Project:** Pivot
> **Generated from:** Documentation maintenance discussion (Dave W + Claude) on 2026-03-02
> **Status:** Final — ready for implementation
> **Architecture:** See `foundation-spec.md` for platform architecture
> **Peer documents:** See `lockin-gate.md` (PR gate), `AGENT.md` (AI entry point)

---

## Why this spec exists

This is a spec-first architecture. The specs *are* the system — code implements them, conformance tests verify them, the lock-in gate enforces them. If specs drift from code, the entire approach breaks down. A stale spec is worse than no spec because it actively misleads.

Now that the repo is public and AI agents are first-class contributors, documentation maintenance needs to be as rigorous and automated as the code itself. This spec defines:

1. What documentation exists and what it covers
2. What triggers a documentation update
3. How AI agents automatically maintain documentation
4. How CI enforces freshness

---

## Doc Registry

The doc registry is the canonical map of which documents cover which parts of the system. It lives at `docs/doc-registry.json` and is machine-readable so AI agents and CI scripts can consume it.

Every documentation file in the repo must have an entry in the registry. If a file isn't in the registry, it's invisible to the maintenance system.

### Registry Structure

```json
{
  "docs": [
    {
      "path": "docs/engine-spec.md",
      "covers": ["src/engine/"],
      "tier": 1,
      "update_trigger": "code",
      "depends_on": ["docs/foundation-spec.md"]
    }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `path` | string | Path to the doc file, relative to repo root |
| `covers` | string[] | Code paths, spec paths, or concept tags this doc is responsible for. Glob patterns allowed. |
| `tier` | 1 \| 2 \| 3 | Doc priority tier (see below) |
| `update_trigger` | `"code"` \| `"spec"` \| `"manual"` | What kind of change triggers an update |
| `depends_on` | string[] | Other docs this one references or derives from — changes cascade |

### Tiers

| Tier | What | Examples | Update expectation |
|------|------|----------|-------------------|
| **1 — Contracts** | Define what the system *is*. Machine-readable where possible. | OpenAPI specs, JSON Schemas, foundation-spec | Must be updated in the same PR as the code change |
| **2 — Component specs** | Define how each piece works. Human-readable architecture docs. | engine-spec, gateway-spec, memory-spec, auth-spec, security-spec | Must be updated in the same PR as the code change |
| **3 — Guides & reference** | Help people use the system. Derived from Tier 1 and 2. | README, AGENT.md, implementers-reference, conformance docs | Updated by AI agent in the same PR, verified in CI |

Tier 1 and 2 docs block merge if stale. Tier 3 docs are auto-updated by AI agents and should not block merge, but CI will warn if they lag.

---

## Update Triggers

A documentation update is required when a change touches code or specs that a document covers. The registry maps these relationships explicitly.

### Trigger Matrix

| Change type | What must be updated | Who updates | Enforcement |
|------------|---------------------|-------------|-------------|
| **Code change** (`src/`) | All docs whose `covers` match the changed paths | AI agent (auto) | CI gate blocks merge if docs are stale |
| **Schema change** (`specs/schemas/`) | All docs referencing the schema + generated types must be regenerated | AI agent (auto) | CI gate + `generate:types` check |
| **OpenAPI change** (`specs/openapi/`) | Component specs for affected contracts + AGENT.md | AI agent (auto) | CI gate |
| **Config change** (`adapters/`, config-related src) | configuration-spec + README quickstart | AI agent (auto) | CI gate |
| **New component or connector** | foundation-spec, AGENT.md, implementers-reference, file map | Human + AI agent | PR review |
| **Architectural/philosophical change** | foundation-spec, relevant component specs, README | Human-authored, AI-verified | PR review |
| **Dependency or tooling change** | README (if user-facing), deployment-spec (if runtime) | AI agent (auto) | CI gate |

### What counts as "stale"

A document is stale when:
1. Code paths it covers were modified in a PR, but the document was not
2. A document it `depends_on` was modified, but it was not
3. Its content contradicts the current code behavior (detected by AI review)

---

## AI Agent Workflow

AI agents are first-class documentation maintainers. The workflow assumes Claude Code or equivalent agents operate on PRs.

### On every PR

```
1. CI runs `check:docs` (see Freshness Check below)
2. If stale docs detected:
   a. AI agent reads the PR diff
   b. AI agent reads the stale docs and the doc registry
   c. AI agent proposes doc updates as commits on the PR branch
   d. If Tier 1 or 2: updates are required before merge
   e. If Tier 3: updates are auto-committed, reviewer verifies
3. If no stale docs: CI passes, no action needed
```

### AI agent responsibilities

| Responsibility | Detail |
|---------------|--------|
| **Mechanical updates** | API signatures, config field names, schema references, file paths, code examples — auto-update without human review |
| **Behavioral updates** | When code changes *what* a component does — update the spec to match, flag for human review |
| **Architectural updates** | When the change affects component boundaries, contracts, or principles — draft an update, require human approval |
| **Contradiction detection** | Flag when doc content contradicts code behavior, even if the doc's `covers` paths weren't modified |

### AI agent constraints

- Never remove architectural rationale (the "why") — only a human removes rationale
- Never change a Tier 1 contract spec without the PR also containing the corresponding code change
- Never weaken a security or lock-in guarantee — flag for human review instead
- Always preserve the existing document's voice and structure
- Always include a summary of what changed and why in the commit message

---

## Freshness Check

The freshness check is a CI-runnable script that detects potentially stale documentation. It integrates with the existing `baseline` pipeline.

### How it works

```
For each doc in doc-registry.json:
  1. Identify files changed in this PR (or since last release tag)
  2. Check if any changed files match the doc's `covers` patterns
  3. Check if any changed files match a doc this doc `depends_on`
  4. If yes to either, and the doc itself was NOT modified: flag as stale
```

### Script: `check:docs`

Added to `package.json` scripts:

```
"check:docs": "tsx scripts/check-docs.ts"
```

Added to the `baseline` pipeline:

```
"baseline": "npm run build && vitest run --reporter=verbose && eslint src/ && npm run check:imports && npm run check:lockin && npm run check:docs"
```

### Output

```
check:docs — documentation freshness check

  STALE  docs/engine-spec.md
         covers: src/engine/
         changed: src/engine/agent-loop.ts (+42 -18)
         action: Tier 2 — update required before merge

  STALE  AGENT.md
         depends_on: docs/foundation-spec.md (modified)
         action: Tier 3 — AI agent will auto-update

  OK     docs/memory-spec.md
  OK     docs/auth-spec.md
  ...

  Result: 2 stale, 18 fresh
  Status: FAIL (Tier 1/2 docs require update before merge)
```

### Exit codes

| Code | Meaning |
|------|---------|
| 0 | All docs fresh |
| 1 | Tier 3 docs stale (warning — AI agent should update, but non-blocking) |
| 2 | Tier 1 or 2 docs stale (blocking — PR cannot merge) |

---

## CI Integration (GitHub Actions)

### Doc freshness gate

Runs on every PR. Blocks merge if Tier 1 or 2 docs are stale.

```yaml
# .github/workflows/docs.yml
name: Documentation Freshness
on:
  pull_request:
    branches: [main]

jobs:
  check-docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # full history for diff
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run check:docs
```

### AI doc update (on every PR)

Claude Code Action runs in automation mode on every PR. It reads the doc registry, identifies stale docs from the PR diff, and commits updates directly to the PR branch.

```yaml
# .github/workflows/doc-update.yml
name: AI Doc Update
on:
  pull_request:
    types: [opened, synchronize]
    branches: [main]

permissions:
  contents: write
  pull-requests: write

jobs:
  update-docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
          ref: ${{ github.event.pull_request.head.ref }}

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - run: npm ci

      # Run check:docs first to identify stale docs
      - name: Check doc freshness
        id: check-docs
        run: npm run check:docs 2>&1 | tee /tmp/check-docs-output.txt || true
        continue-on-error: true

      # If stale docs detected, run Claude Code Action to update them
      - uses: anthropics/claude-code-action@v1
        if: steps.check-docs.outcome == 'failure'
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          prompt: |
            You are maintaining documentation for the personal-ai-architecture repo.

            Read docs/doc-maintenance-spec.md for the full maintenance rules and constraints.
            Read docs/doc-registry.json for the doc-to-code mapping.

            The `check:docs` script detected stale documentation in this PR.
            Here is its output:
            $(cat /tmp/check-docs-output.txt)

            For each stale doc:
            1. Read the PR diff to understand what changed in the code
            2. Read the current doc
            3. Update the doc to accurately reflect the code changes
            4. Follow the AI agent constraints in doc-maintenance-spec.md:
               - Never remove architectural rationale (the "why")
               - Never weaken security or lock-in guarantees
               - Preserve the document's existing voice and structure
               - For Tier 1/2 docs: update content to match code changes
               - For Tier 3 docs: update references, paths, and examples

            After updating, run `npm run check:docs` to verify all docs are now fresh.
          claude_args: |
            --model claude-opus-4-6
            --max-turns 20
```

### Workflow ordering

The doc freshness gate and AI doc update workflows both run on PRs. The intended flow:

1. **AI Doc Update** runs first — Claude reads the diff, updates stale docs, commits to the branch
2. The commit triggers a re-run of the **Documentation Freshness** gate
3. If Claude's updates resolved all staleness, the gate passes
4. If Tier 1/2 docs are still stale (e.g., architectural changes needing human input), the gate blocks merge and Claude leaves a PR comment explaining what needs human attention

---

## Adding the Doc Gate to the Lock-In Gate

The lock-in gate (`docs/lockin-gate.md`) gets one new check:

```
- [ ] **Documentation freshness verified:** `npm run check:docs` passes — all stale docs
      are updated in this PR.
```

This ensures doc maintenance is part of the same review process as lock-in checks.

---

## Maintaining the Registry

The doc registry itself must be maintained. Rules:

1. **New doc created** → add a registry entry in the same PR
2. **Doc deleted** → remove the registry entry in the same PR
3. **Code restructured** (paths change) → update `covers` patterns in the same PR
4. **New code directory** → verify existing docs cover it, or create a new doc + registry entry

The `check:docs` script validates registry integrity:
- Every file in `docs/` and root `*.md` files must have a registry entry
- Every `covers` path must resolve to an existing file or directory
- Every `depends_on` path must resolve to a registered doc
- No circular dependencies in `depends_on`

---

## What This Spec Does NOT Cover

| Out of scope | Why |
|-------------|-----|
| Inline code comments | Code comments are a code quality concern, not a documentation maintenance concern |
| External documentation (website, blog) | This spec governs repo-internal docs only |
| Changelog / release notes | Separate concern — may get its own spec |
| Translation / i18n of docs | Not needed at this stage |
| Doc style guide (tone, formatting) | Implicit from existing specs — formalize if needed later |

---

## Conformance

The doc maintenance system is working correctly when:

1. `npm run check:docs` exits 0 on a clean main branch
2. A PR that modifies `src/engine/` without modifying `docs/engine-spec.md` causes `check:docs` to exit 2
3. A PR that modifies a Tier 1 doc triggers cascade detection on dependent Tier 2/3 docs
4. The doc registry has an entry for every markdown file in the repo
5. The AI agent can read the registry, identify stale docs, and produce valid updates
