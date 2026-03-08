---
hide_table_of_contents: true
---

# Zero Lock-In Audit (Milestone / Release)

## 1. Universal Architecture Checks

### Memory and Data Ownership

- [ ] Durable owner value still lives in Your Memory, not in provider-specific systems (D43, D135).
- [ ] Data written by the system remains inspectable with standard tools (D138).
- [ ] Export/import of owner data remains feasible without lossy conversion.
- [ ] No hidden metadata or proprietary format is required to understand owner data.

### Boundaries and Contracts

- [ ] Component boundaries remain contract-driven — Gateway API, Provider API, Gateway-Engine contract (D64, D137).
- [ ] No new dependency on another component's internals has been introduced (Principle 3).
- [ ] Framework/library choices remain internal implementation details (Principle 2).

### Configuration and Swappability

- [ ] Provider/model/tool choices remain runtime configuration concerns, not hardcoded decisions (D147).
- [ ] Adapters remain thin translation layers, not policy/logic hubs (D139).
- [ ] Swap cost remains localized (adapter/config), not cross-component rewrites.

### Deployment and Network Posture

- [ ] Local owner-controlled deployment path remains valid (D148).
- [ ] Offline operation path remains valid with local model and local tools (D148).
- [ ] Default bind posture remains localhost-only unless explicitly configured otherwise (D148).
- [ ] No automatic discovery, port-forwarding, or silent outbound network behavior was added.

### Security and Change Safety

- [ ] No secrets were introduced into source-controlled files or owner memory content.
- [ ] Auth data and policies remain portable with owner-controlled export path.
- [ ] Update flow preserves existing owner data and remains reversible in failure scenarios.

---

## 2. Component-Specific Checks

Run the sections that match changed areas.

### Engine

- [ ] Engine remains generic — no product-specific behavior in core loop (D39).
- [ ] Engine behavior continues to emerge from memory content + tools + config (D40).
- [ ] Engine remains provider-agnostic behind Provider API adapters (D139).
- [ ] Tool execution path remains protocol-agnostic at Level 1 — MCP default is allowed, not mandatory (D32, D53).

### Gateway

- [ ] Gateway remains client-agnostic and content-agnostic at Level 1 (D57, D58).
- [ ] Conversation lifecycle stays in Gateway without coupling Gateway to Engine internals (D58).
- [ ] Gateway-Engine interaction remains within the internal contract scope (D137).

### Auth

- [ ] Auth remains a cross-cutting layer independent of Gateway/Engine implementation internals (D60).
- [ ] Permission model changes remain additive and backward-compatible where practical.
- [ ] Auth implementation choices do not create a single inescapable identity-provider dependency.

### Your Memory Tooling

- [ ] Storage/tool abstractions remain stable if storage backend changes — tools define the contract, not the storage (D135).
- [ ] Memory organization conventions remain transparent and owner-readable (D43).
- [ ] Version/history behavior remains portable and inspectable.

### Clients

- [ ] Clients remain thin against Gateway API — no server-coupled business logic introduced client-side (D57).
- [ ] Client changes do not require server architecture changes unless contract/versioned intentionally.

### Models and Provider Integration

- [ ] Model choice remains configuration-driven (D63, D147).
- [ ] Provider-specific request/stream/tool-call details remain adapter concerns (D139).
- [ ] Fallback routing strategy remains possible via config/adapters.

### Tools

- [ ] Tools remain independently addable/removable without core code changes (D51).
- [ ] Tool discovery remains source-driven and self-description based (D146).
- [ ] Non-default tool protocols, if used, remain isolated behind clear adapter/execution boundaries (D32).

---

## 3. API and Interface Checks

### Gateway API

- [ ] Gateway API remains based on open, documented conventions (D16).
- [ ] Adapter layer can absorb external API shape changes without core component rewrites (D139).

### Provider API

- [ ] Provider API remains stable for Engine-side usage.
- [ ] Provider-specific quirks remain outside Engine core.

### Gateway-Engine Contract

- [ ] Internal contract remains explicit and versioned as needed (D137).
- [ ] New fields/behavior are backward-compatible or version-gated.
- [ ] Interface remains internal — not promoted into a third public API by accident (D137).

---

## 4. D147 Anti-Lock-In Verification

Run this for milestone/release and for major adapter/config changes.

### Provider Swap

- [ ] Run baseline scenario with Provider A.
- [ ] Switch provider adapter/config to Provider B.
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

- [foundation-spec.md](./foundation-spec.md)
- [deployment-spec.md](./deployment-spec.md)
- [configuration-spec.md](./configuration-spec.md)
- [adapter-spec.md](./adapter-spec.md)
- [gateway-engine-contract.md](./gateway-engine-contract.md)
- [security-spec.md](./security-spec.md)
- [research/lock-in-analysis.md](./research/lock-in-analysis.md)

