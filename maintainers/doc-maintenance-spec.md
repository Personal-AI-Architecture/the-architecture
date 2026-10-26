# Documentation Maintenance Spec

## Why this spec exists

This is a spec-first architecture. The specs *are* the system — code implements them, conformance tests verify them, the lock-in gate enforces them. If specs drift from code, the entire approach breaks down. A stale spec is worse than no spec because it actively misleads.

Now that the repo is public and AI agents are first-class contributors, documentation maintenance needs to be as rigorous and automated as the code itself. This spec defines:

1. What documentation exists and what it covers
2. What triggers a documentation update
3. How contributors and AI agents maintain documentation
4. How CI enforces freshness

---

## Doc Registry

The doc registry is the canonical map of which documents cover which parts of the system. It lives at `maintainers/doc-registry.json` and is machine-readable so AI agents and CI scripts can consume it.

Every markdown file in the following locations must have an entry in the registry:
- ` **/*.md` — all spec, guide, conformance, and research docs
- `*.md` at the repo root — README.md, AGENT.md

Files outside these locations (e.g., `tasks/*.md`, `node_modules/`) are excluded. If a file isn't in the registry, it's invisible to the maintenance system.

### Registry Structure

```json
{
  "docs": [
    {
      "path": "architecture/agent-loop-spec.md",
      "covers": ["src/agent-loop/"],
      "tier": 1,
      "update_trigger": "code",
      "depends_on": ["architecture/overview.md"]
    }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `path` | string | Path to the doc file, relative to repo root |
| `covers` | string[] | File or directory paths this doc is responsible for, relative to repo root. Directory prefixes must end with `/`. Every entry must resolve to an existing file or directory. |
| `tier` | 1 \| 2 \| 3 | Doc priority tier (see below) |
| `update_trigger` | `"code"` \| `"spec"` \| `"manual"` | Describes the *primary* reason this doc changes. The checker evaluates `covers` and `depends_on` for every trigger type; `manual` marks a human-maintained document but does not suppress a warning. |
| `depends_on` | string[] | Other docs this one references or derives from — changes cascade |

### Tiers

| Tier | What | Examples | Update expectation |
|------|------|----------|-------------------|
| **1 — Contracts** | Define what the system *is*. Machine-readable where possible. | OpenAPI specs, JSON Schemas, architecture overview | Must be updated in the same PR as the code change |
| **2 — Component specs** | Define how each piece works. Human-readable architecture docs. | agent-loop-spec, gateway-spec, memory-spec, auth-spec, security-spec | Must be updated in the same PR as the code change |
| **3 — Guides & reference** | Help people use the system. Derived from Tier 1 and 2. | README, AGENT.md, documentation guide, conformance checklists | Updated in the same PR where practical; CI warns if they lag |

The retired `build/` primer and blueprint layer is not a documentation tier.
AI builders read the same architecture, contracts and conformance material as
human builders, plus the implementation template for their language.

Tier 1 and 2 docs block merge if stale. Tier 3 docs do not block merge, but CI warns if they lag. AI agents may prepare updates; CI does not edit PR branches.

---

## Update Triggers

A documentation update is required when a change touches code or specs that a document covers. The registry maps these relationships explicitly.

### Trigger Matrix

| Change type | What must be updated | Who updates | Enforcement |
|------------|---------------------|-------------|-------------|
| **Code change** (`src/`) | All docs whose `covers` match the changed paths | Contributor or AI agent | Registry freshness gate when those paths exist |
| **Schema change** (`contracts/schemas/`) | Docs that cover or depend on the changed schema | Contributor or AI agent | Registry freshness and contract example checks |
| **OpenAPI change** (`contracts/openapi/`) | Component specs for affected contracts + AGENT.md | Contributor or AI agent | Registry freshness gate |
| **Config change** (`adapters/`, config-related src) | configuration-spec + README quickstart | Contributor or AI agent | Registry freshness gate when those paths exist |
| **New component or API** | architecture overview, AGENT.md, documentation guide, file map | Human + AI agent | PR review |
| **Architectural/philosophical change** | architecture overview, relevant component specs, README | Human-authored, AI-verified | PR review |
| **Dependency or tooling change** | README (if user-facing), deployment-spec (if runtime) | Contributor or AI agent | Registry freshness gate where dependencies are registered |

### What counts as "stale"

A document is stale when:
1. Code paths it covers were modified in a PR, but the document was not
2. A document it `depends_on` was modified, but it was not

These two conditions are deterministic and enforced by CI. Additionally, AI agents may detect that a document's content contradicts current code behavior even when the above conditions are not triggered. This is a best-effort advisory — the AI agent should flag the contradiction as a PR comment for human review, but it is not a CI gate criterion.

---

## AI Agent Workflow

AI agents can help contributors keep documents current. The CI job only checks
the submitted branch; it does not run an agent, use a paid API, or push edits.

### On every PR

```
1. CI compares the PR with its merge base and runs `scripts/check-docs.py`.
2. If docs are stale, the contributor or an AI agent reads the diff and registry,
   updates the relevant docs, and pushes a new commit.
3. Tier 1/2 staleness fails CI. Tier 3 staleness is printed as a warning.
4. CI reruns on the new commit. A reviewer checks that updates are accurate.
```

### AI agent responsibilities

| Responsibility | Detail |
|---------------|--------|
| **Mechanical updates** | API signatures, config field names, schema references, file paths, code examples — propose updates for review |
| **Behavioral updates** | When code changes *what* a component does — update the spec to match, flag for human review |
| **Architectural updates** | When the change affects component boundaries, contracts, or principles — draft an update, require human approval |
| **Contradiction detection** | Flag when doc content contradicts code behavior, even if the doc's `covers` paths weren't modified |

### AI agent constraints

- Never remove architectural rationale (the "why") — only a human removes rationale
- Never change a Tier 1 contract spec merely to fit implementation drift; propose the contract change for review
- Never weaken a security or lock-in guarantee — flag for human review instead
- Always preserve the existing document's voice and structure
- Always include a summary of what changed and why in the commit message

---

## Freshness Check

`scripts/check-docs.py` validates the registry and compares changed files with
registered `covers` and `depends_on` relationships. Run it with a Git base when
checking a PR or a completed change:

```bash
python3 scripts/check-docs.py --base origin/main
```

Without `--base`, it examines uncommitted and untracked files in the current
checkout. With `--strict`, Tier 3 staleness also fails; the CI gate uses the
default mode so Tier 3 remains advisory.

| Result | Default exit code | CI effect |
|--------|-------------------|-----------|
| Registry invalid or Tier 1/2 doc stale | 2 | Fail |
| Only Tier 3 docs stale | 0 | Warn in job output |
| All docs fresh | 0 | Pass |

The checker detects changed paths and registry relationships. It cannot judge
whether revised prose is correct; reviewers still assess the content.

---

## CI Integration (GitHub Actions)

`.github/workflows/repository-checks.yml` runs on PRs to `main`, pushes to
`main`, and manual dispatch. It has read-only repository permission, checks out
full Git history, sets up Python 3.12, and installs the pinned check dependency
from `requirements-ci.txt`. For PRs it uses the merge base with the target
branch; for pushes it uses the previous commit. It then runs:

```bash
python3 scripts/check-docs.py --base "$PAA_CHECK_BASE"
python3 scripts/check-links.py
python3 scripts/check-contracts.py
python3 contracts/examples/validate-manifest.py
python3 conformance/runner.py
git diff --check "$PAA_CHECK_BASE" HEAD
```

The link checker validates local file paths and Markdown anchors, including
reference-style links and HTML images; it does not depend on external sites
being reachable. The contract checker validates every JSON Schema against the
Draft 2020-12 metaschema, resolves repository-local references, validates all
OpenAPI documents, and checks the example manifest against its schema.
The example validator checks published valid and invalid examples against their
supported contract shapes. The executable conformance runner checks the
repository's contract baseline. The language-neutral runtime scenarios in
`conformance/*.md` are specifications for target implementations and are not
executed by this repository job. Template repositories run their own target
checks and the shared validator separately.

CI does not rewrite documentation or invoke an AI agent. A failing check leaves
its output on the PR for a contributor to resolve. The mirror workflow is
separate and does not replace these validation checks.

---

## Adding the Doc Gate to the Lock-In Gate

The lock-in gate (`conformance/lockin-gate.md`) includes a documentation check:

```
- [ ] **Documentation freshness verified:** `python3 scripts/check-docs.py --base origin/main` passes — Tier 1/2 stale docs are updated in this PR; review Tier 3 warnings.
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
- Every markdown file in ` **/*.md` and `*.md` at the repo root must have a registry entry
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

For the D201 outside-adapter rule, the binding principle, adapter spec and decision stay aligned with the lock-in gate and ARCH-23. A change to any one of those requires a freshness review of the others through the registry.

The repository check is working correctly when:

1. The validation workflow runs on a PR from a fresh checkout and passes for valid repository contents.
2. A PR that changes a registered Tier 1/2 dependency without updating its dependent doc fails the freshness check.
3. A Tier 3-only stale doc is reported without failing the default CI gate.
4. The registry lists every repository Markdown file and rejects missing paths or dependency cycles.
5. Invalid contract examples or broken executable conformance invariants fail the job.
