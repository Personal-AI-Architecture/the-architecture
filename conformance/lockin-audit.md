# Zero Lock-In Audit (Milestone / Release)

Before recording an audit result, run `python3 scripts/check-docs.py` so the audit and its gate are evaluated against the current documentation registry.

## 1. Universal Architecture Checks

### Memory and Data Ownership

- [ ] Durable owner value still lives in Your Memory, not in provider-specific systems (D43, D135).
- [ ] Data written by the system remains inspectable with standard tools (D138).
- [ ] Export/import of owner data remains feasible without lossy conversion.
- [ ] No hidden metadata or proprietary format is required to understand owner data.

### Boundaries and Contracts

- [ ] Component boundaries remain contract-driven — Gateway API, Model API, Gateway-Agent Loop contract (D64, D137).
- [ ] No new dependency on another component's internals has been introduced (Principle 3).
- [ ] Framework/library choices remain internal implementation details (Principle 2).

### Configuration and Swappability

- [ ] Provider/model/tool choices remain runtime configuration concerns, not hardcoded decisions (D147).
- [ ] Adapters remain thin translation layers, not policy/logic hubs (D139).
- [ ] Swap cost remains localized (adapter/config), not cross-component rewrites.
- [ ] Invalid selected adapters fail startup clearly, while a configured remote provider's outage does not prevent local startup (ARCH-12).

### Deployment and Network Posture

- [ ] Local owner-controlled deployment path remains valid (D148).
- [ ] Offline operation path remains valid with local model and local tools (D148).
- [ ] Default bind posture remains localhost-only unless explicitly configured otherwise (D148).
- [ ] No automatic discovery, port-forwarding, or silent outbound network behavior was added.

### Security and Change Safety

- [ ] No secrets were introduced into Your Memory or any git-tracked file (secrets stay in environment variables, an untracked config file, or a secret store).
- [ ] Auth data and policies remain portable with owner-controlled export path.
- [ ] Update flow preserves existing owner data and remains reversible in failure scenarios.

---

## 2. Component-Specific Checks

Run the sections that match changed areas.

### Agent Loop

- [ ] Agent Loop remains generic — no product-specific behavior in core loop (D39).
- [ ] Agent Loop behavior continues to emerge from memory content + tools + config (D40).
- [ ] Agent Loop remains provider-agnostic behind Model API adapters (D139).
- [ ] Tool execution path remains protocol-agnostic in the architecture — MCP default is allowed, not mandatory (D32, D53).

### Gateway

- [ ] Gateway remains client-agnostic and content-agnostic in the architecture (D57, D58).
- [ ] Conversation lifecycle stays in Gateway without coupling Gateway to Agent Loop internals (D58).
- [ ] Gateway-Agent Loop interaction remains within the internal contract scope (D137).

### Auth

- [ ] Auth remains a cross-cutting layer independent of Gateway/Agent Loop implementation internals (D60).
- [ ] The Gateway still calls Auth on every request and the Agent Loop still asks Auth before each tool call; permissions live only in Auth, not in configuration.
- [ ] The default policy is still that the owner can do everything; no approval step was added as an architecture default.
- [ ] Permission model changes remain additive and backward-compatible where practical.
- [ ] Auth implementation choices do not create a single inescapable identity-provider dependency.

### Your Memory Tooling

- [ ] Storage/tool abstractions remain stable if storage backend changes — tools define the contract, not the storage (D135).
- [ ] Memory organization conventions remain transparent and owner-readable (D43).
- [ ] Version history and restore remain available, portable and inspectable, without hard-coding one mechanism (Git is one option).

### Clients

- [ ] Clients remain thin against Gateway API — no server-coupled business logic introduced client-side (D57).
- [ ] Client changes do not require server architecture changes unless contract/versioned intentionally.

### Models and Provider Integration

- [ ] Model and provider-profile choice remain owner preferences passed with each request; a change applies to the next message with no restart (D63, D147, D175).
- [ ] Provider-specific request/stream/tool-call details remain adapter concerns (D139).
- [ ] An unresolved provider failure reports `provider_error` and stops the turn after any one recorded retry on the selected model and provider profile. No silent switch to another model or provider occurs (D188); an explicit owner retry or provider change after the failed turn is optional product behavior.

### Tools

- [ ] Tools remain independently addable/removable without core code changes (D51).
- [ ] Tool discovery remains source-driven and self-description based (D146).
- [ ] Non-default tool protocols, if used, remain isolated behind clear adapter/execution boundaries (D32).

---

## 3. API and Interface Checks

### Gateway API

- [ ] Gateway API remains based on open, documented conventions (D16).
- [ ] Adapter layer can absorb external API shape changes without core component rewrites (D139).

### Model API

- [ ] Model API remains stable for Agent Loop-side usage.
- [ ] Provider-specific quirks remain outside Agent Loop core.

### Gateway-Agent Loop Contract

- [ ] Internal contract remains explicit and versioned as needed (D137).
- [ ] New fields/behavior are backward-compatible or version-gated.
- [ ] Interface remains internal — not promoted into a third public API by accident (D137).

---

## 4. D147 Anti-Lock-In Verification

Run this for milestone/release and for major adapter/config changes.

### Provider Swap

- [ ] Run baseline scenario with Provider A.
- [ ] Switch to Provider B (change the active provider preference if it is a listed profile; otherwise provider adapter/config).
- [ ] Re-run same scenario.
- [ ] Verify no cross-component code edits were required.

### Model Swap

- [ ] Change model selection in config/preferences only.
- [ ] Re-run same scenario.
- [ ] Verify no code edits were required.

### Tool Swap

- [ ] Add a tool through configured tool source(s) and verify usage.
- [ ] Remove a tool and verify graceful capability reduction.
- [ ] Verify no core code edits were required.

### Audit Verdict

- [ ] Swaps stayed localized (config/adapters/tools) with no architecture drift.
- [ ] Any exception is documented with owner-approved rationale and follow-up plan.

---

## 5. Evidence Capture

- [ ] Link test run IDs / logs for provider/model/tool swap checks.
- [ ] Link network verification evidence (offline run and no-unexpected-egress check).
- [ ] Link export/import or inspectability evidence for memory/auth data.
- [ ] Link release/update safety notes where storage/schema/auth changed.

---

## Quick Reference: The Swappability Chain

Everything in the architecture has an intermediary that absorbs change (D139):

| Thing | Swappable via | Swap cost |
|-------|--------------|-----------|
| **Your Memory storage** | Tools | Zero — tools absorb it |
| **Components** | Contracts | One component swap |
| **Contracts** | Adapters | One adapter swap |

If you're auditing something and can't identify which intermediary protects it, something is missing.

---

## Related Docs

- [overview.md](../architecture/overview.md)
- [deployment-spec.md](../architecture/deployment-spec.md)
- [configuration-spec.md](../architecture/configuration-spec.md)
- [adapter-spec.md](../architecture/adapter-spec.md)
- [gateway-agent-loop-contract.md](../architecture/gateway-agent-loop-contract.md)
- [security-spec.md](../architecture/security-spec.md)
- [lock-in-analysis.md](../architecture/background/lock-in-analysis.md)

