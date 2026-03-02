# Zero Lock-In Checklist (Index)

> **Project:** Pivot
> **Status:** Canonical checklist split into gate + audit.
> **Parent:** `foundation-spec.md`

---

Use these documents:

1. `lockin-gate.md`
   Mandatory PR gate. Short, high-signal, required for non-trivial changes.

2. `lockin-audit.md`
   Milestone/release audit. Deeper verification for architecture drift and swap claims.

3. `foundation-verification.md`
   Full architecture compliance spec. Verifies every claim in `foundation-spec.md` — structure, pillars, principles, contracts, responsibilities, user stories, deployment. Run at release or architecture change. The gate and audit are operational subsets of this.

---

## Why Three Levels

| Level | When | What | Time |
|-------|------|------|------|
| **Gate** | Every PR | Lock-in prevention | Minutes |
| **Audit** | Milestones | Swap tests + drift detection | Hours |
| **Verification** | Releases / arch changes | Full foundation compliance | Half day |

The gate and audit are fast operational tools extracted from the verification spec. The verification spec is the comprehensive source of truth — if it's not verifiable there, it's not verifiable.

