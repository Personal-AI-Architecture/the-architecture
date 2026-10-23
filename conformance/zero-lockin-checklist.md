# Zero Lock-In Checklist (Index)

Use these documents:

Run `python3 scripts/check-docs.py` before using this checklist so the linked gate and audit documents are fresh.

1. [lockin-gate.md](./lockin-gate.md)
   Mandatory PR gate. Short, high-signal, required for non-trivial changes.

2. [lockin-audit.md](./lockin-audit.md)
   Milestone/release audit. Deeper verification for architecture drift and swap claims.

3. [foundation-verification.md](./foundation-verification.md)
   Full architecture compliance spec. Verifies every claim in [overview.md](../architecture/overview.md) — structure, owner outcomes, principles, contracts, responsibilities, user stories, deployment. Run at release or architecture change. The gate and audit are operational subsets of this.

---

## Why Three Levels

| Level | When | What | Time |
|-------|------|------|------|
| **Gate** | Every PR | Lock-in prevention | Minutes |
| **Audit** | Milestones | Swap tests + drift detection | Hours |
| **Verification** | Releases / arch changes | Full foundation compliance | Half day |

The gate and audit are fast operational tools extracted from the verification spec. The verification spec is the comprehensive source of truth — if it's not verifiable there, it's not verifiable.

For adapter changes, also use [ARCH-12](./arch-tests.md#arch-12-unsupported-adapter-cannot-start-silently): a failed configuration cannot silently choose another provider or make the owner dependent on one.

