---
hide_table_of_contents: true
---

# Documentation Maintenance Spec

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

Every markdown file in the following locations must have an entry in the registry:
- `docs/**/*.md` — all spec, guide, conformance, and research docs
- `*.md` at the repo root — README.md, AGENT.md

Files outside these locations (e.g., `tasks/*.md`, `node_modules/`) are excluded. If a file isn't in the registry, it's invisible to the maintenance system.

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
| `covers` | string[] | File or directory paths this doc is responsible for, relative to repo root. Directory prefixes must end with `/`. Every entry must resolve to an existing file or directory. |
| `tier` | 1 \| 2 \| 3 | Doc priority tier (see below) |
| `update_trigger` | `"code"` \| `"spec"` \| `"manual"` | Describes the *primary* reason this doc changes. `"code"`: primarily maintained because code it covers changes. `"spec"`: primarily maintained because upstream specs it depends on change. `"manual"`: doc is never flagged stale by CI — maintained by humans only (used for research docs, philosophical analysis, and other documents where automated freshness detection is not meaningful). Note: regardless of trigger type, the freshness check always evaluates both `covers` and `depends_on` — a doc is stale if *either* condition is met. The trigger field is metadata for human/AI understanding, not a filter on which conditions are checked. |
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

These two conditions are deterministic and enforced by CI. Additionally, AI agents may detect that a document's content contradicts current code behavior even when the above conditions are not triggered. This is a best-effort advisory — the AI agent should flag the contradiction as a PR comment for human review, but it is not a CI gate criterion.

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

Added to the `baseline` pipeline. The `check:docs` script uses exit code 1 for Tier 3 warnings (non-blocking) and exit code 2 for Tier 1/2 failures (blocking). The baseline pipeline uses `check:docs` (default mode), which remaps exit code 1 to 0 so Tier 3 warnings don't break CI. Use `check:docs:strict` for full audits where Tier 3 staleness should also fail:

```
"check:docs": "tsx scripts/check-docs.ts",
"check:docs:strict": "tsx scripts/check-docs.ts --strict",
"baseline": "npm run build && vitest run --reporter=verbose && eslint src/ && npm run check:imports && npm run check:lockin && npm run check:docs"
```

- `check:docs` — exits 0 if no Tier 1/2 staleness (Tier 3 warnings print but don't fail)
- `check:docs:strict` — exits non-zero on any staleness including Tier 3 (useful for full audits)

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

| Code | Meaning | Blocks merge? |
|------|---------|---------------|
| 0 | All docs fresh | No |
| 1 | Tier 3 docs stale (warning — AI agent should update) | No — `check:docs` treats as success, `check:docs:strict` treats as failure |
| 2 | Tier 1 or 2 docs stale | Yes — always blocks |

The `check:docs` script (default mode) remaps exit code 1 to 0 so Tier 3 warnings don't break CI. The `--strict` flag preserves exit code 1 for full audits.

---

## CI Integration (GitHub Actions)

A single workflow handles both detection and AI auto-update as sequential jobs. This avoids the GitHub Actions limitation where two separate workflows triggered by the same event have no guaranteed ordering.

```yaml
# .github/workflows/docs.yml
name: Documentation Freshness
on:
  pull_request:
    branches: [main]

permissions:
  contents: write
  pull-requests: write

jobs:
  # Job 1: Detect stale docs
  check-docs:
    runs-on: ubuntu-latest
    outputs:
      exit_code: ${{ steps.check.outputs.exit_code }}
      check_output: ${{ steps.check.outputs.check_output }}
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
          ref: ${{ github.event.pull_request.head.ref }}
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - name: Check doc freshness
        id: check
        run: |
          set +e
          output=$(npm run check:docs:strict 2>&1)
          code=$?
          echo "exit_code=$code" >> "$GITHUB_OUTPUT"
          echo "check_output<<CHECKEOF" >> "$GITHUB_OUTPUT"
          echo "$output" >> "$GITHUB_OUTPUT"
          echo "CHECKEOF" >> "$GITHUB_OUTPUT"
          exit 0

  # Job 2: AI auto-update (only if stale docs detected)
  ai-update:
    needs: check-docs
    if: needs.check-docs.outputs.exit_code != '0'
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
      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          prompt: |
            You are maintaining documentation for the personal-ai-architecture repo.

            Read docs/doc-maintenance-spec.md for the full maintenance rules and constraints.
            Read docs/doc-registry.json for the doc-to-code mapping.

            The `check:docs` script detected stale documentation in this PR.
            Here is its output:
            ${{ needs.check-docs.outputs.check_output }}

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

  # Job 3: Final gate (runs after AI update, or directly if no staleness)
  gate:
    needs: [check-docs, ai-update]
    if: always()
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
      - name: Final doc freshness gate
        run: npm run check:docs
```

### Workflow mechanics

1. **check-docs** job captures the exit code and output without failing the workflow
2. **ai-update** job runs only if staleness was detected (exit code != 0) — Claude reads the diff, updates stale docs, commits to the branch
3. **gate** job always runs last — pulls the latest branch state (including Claude's commits) and runs `check:docs` (which only fails on Tier 1/2 staleness)
4. If Tier 1/2 docs are still stale after the AI update (e.g., architectural changes needing human input), the gate blocks merge

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
- Every markdown file in `docs/**/*.md` and `*.md` at the repo root must have a registry entry
- Every `covers` entry must resolve to an existing file or directory
- Every `depends_on` entry must resolve to a registered doc
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
4. The doc registry has an entry for every markdown file in `docs/**/*.md` and `*.md` at the repo root
5. The AI agent can read the registry, identify stale docs, and produce valid updates
