# Accepted MVP Limits

> Explicit product limitations that are allowed in MVP without counting as architecture drift.

## Purpose

Separate acceptable MVP scope cuts from forbidden architectural shortcuts so future plans and implementations do not blur the two.

## Allowed In MVP

- Terminal-only client
- Local Docker deployment only
- No web UI
- No managed hosting
- No skill system
- No marketplace-style tool UX
- No multi-identity auth policy store beyond local-owner-mode
- No configurable audit detail levels beyond structured stdout JSON
- No broad general-purpose structured Memory query surface beyond what MVP needs for conversations and owned state
- Conversation resumption may remain a product limitation
- Approval may still be rendered in the terminal client

## Not Allowed Even In MVP

- Ephemeral-only conversations
- Private in-process conversation store as source of truth
- Auth omitted from the real request path
- Config collapsed into one BrainDrive-specific loader
- Hardcoded adapter selection in product code
- Best-effort version history startup
- Missing export surface
- Approval that exists only as local client control flow and not as contract-visible interaction
- Unsafe raw error text in client-facing surfaces
- Internet-required runtime with no local-model offline path

## Interpretation Rules

- A product limitation is allowed only if component ownership and contract rules still hold.
- A UX simplification is not allowed if it removes a required boundary.
- A deferred feature is not allowed if it forces side storage outside Memory, bypasses Auth, or changes contract ownership.
- If a limitation conflicts with `docs/ai/compliance-matrix.md`, it is not an accepted MVP limit.

## Common Misreads To Avoid

- "No conversation resumption" does not mean conversations may be ephemeral.
- "Approval may stay terminal-rendered" does not mean approval may live only in terminal-local control flow.
- "No broad structured Memory query surface" does not mean structured or queryable owner data may live outside Memory.
- "Local-owner-mode auth" does not mean Auth may be removed from runtime wiring.

## Audit Questions

- Is this a product limitation or an architecture shortcut?
- Does the limitation preserve component boundaries?
- Does the limitation preserve the required contract and Memory/Auth behavior?
- Is the limitation explicitly allowed here, or is it actually drift?

## Source Docs

- `docs/ai/foundation.md`
- `docs/ai/gateway.md`
- `docs/ai/memory.md`
- `docs/ai/auth.md`
- `docs/ai/security.md`
- `docs/ai/deployment.md`
- `docs/ai/compliance-matrix.md`
- `spec/mvp-build-primer.md`
