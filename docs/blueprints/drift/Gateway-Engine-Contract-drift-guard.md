# Gateway-Engine Contract Drift Guard

This document defines anti-drift controls for the internal Gateway-Engine handoff contract.

## 1. Top Drift Patterns

- Gateway sends non-contract fields to Engine (config leakage).
- Metadata becomes a hidden runtime/provider/tool configuration channel.
- Auth bypass path appears between Gateway and Engine.
- Stream event taxonomy diverges from canonical event set.
- Error taxonomy collapses or uses unsafe raw messages.
- Pre-stream and mid-stream error channels become ambiguous.
- Tool-call/result ID continuity breaks.
- Approval interaction is handled off-contract in local UI/CLI flow only.
- Internal contract is promoted into a third external API.
- Gateway and Engine become code-coupled beyond contract shape.

## 2. Prohibited Implementation Shortcuts

- Forwarding client payload directly as internal handoff without normalization.
- Allowing request metadata keys for provider/model/tool/runtime overrides.
- Emitting ad hoc stream events to simplify local client handling.
- Returning raw exception text directly in stream `error.message`.
- Handling approval only in local client state without contract representation.
- Skipping Auth middleware for "trusted" internal paths.
- Requiring cross-component code rewrites for contract-preserving swaps.

## 3. Auto-Check Assertions

| Check ID | Assertion | Validation Mechanism | Severity |
|---|---|---|---|
| GECD-CHK-001 | Request remains bounded to `messages + metadata` | Schema validation against `Gateway-Engine-Contract.schema.json` | Critical |
| GECD-CHK-002 | `metadata.correlation_id` required | Negative request tests | Critical |
| GECD-CHK-003 | Metadata keys restricted to contract set | Metadata schema and negative tests | Critical |
| GECD-CHK-004 | Hidden provider/tool/runtime fields rejected | Fuzz/negative payload tests | Critical |
| GECD-CHK-005 | Auth enforced on handoff path | Integration tests for unauthorized access | Critical |
| GECD-CHK-006 | Stream event set remains canonical | Event-contract tests | Critical |
| GECD-CHK-007 | Mid-stream error taxonomy preserved | Fault-injection classification tests | Critical |
| GECD-CHK-008 | Error messages are safe | Sanitization tests for path/token/stack leakage | Critical |
| GECD-CHK-009 | Error channel split deterministic (HTTP vs SSE) | Pre-stream and mid-stream error-path tests | High |
| GECD-CHK-010 | Tool-call/result ID continuity preserved | Tool roundtrip continuity tests | High |
| GECD-CHK-011 | Completion event has reconciliation identifiers | Done-payload contract tests | Critical |
| GECD-CHK-012 | Contract remains internal boundary | Architecture/boundary classification tests | Critical |
| GECD-CHK-013 | Approval represented in contract interaction flow | Approval-required stream and decision path tests | Critical |
| GECD-CHK-014 | Gateway and Engine remain independently swappable | Contract-compatibility swap tests | High |

## 4. Contract-Break Indicators

- Request payloads include `provider`, `model`, `api_key`, `tool_sources`, or similar config fields.
- Engine processes requests with missing `correlation_id`.
- Unauthorized requests reach Engine loop.
- Event names outside canonical set are emitted.
- Error codes not in `provider_error/tool_error/context_overflow` appear.
- `error.message` contains filesystem paths, stack traces, or secrets.
- `done` lacks `conversation_id` or `message_id`.
- Approval-required actions occur without contract-visible approval signals.
- Gateway-Engine contract appears in external/public API listing.

## 5. Fail Build If

- Any Critical auto-check fails.
- Any `GEC-MUST-*` conformance vector fails.
- Auth bypass on Gateway -> Engine path is detected.
- Hidden request-time configuration channels are accepted.
- Any unsafe stream error leakage is detected.
- Contract is exposed as a third external API boundary.
- Conflict register contains unresolved High-risk internal boundary conflicts.

## 6. Drift Detection Checklist

- [ ] All `GEC-MUST-*` vectors pass (positive and negative).
- [ ] Request payload remains bounded to `messages + metadata`.
- [ ] `metadata.correlation_id` is required and propagated.
- [ ] Metadata rejects provider/tool/runtime reconfiguration fields.
- [ ] Auth context is enforced on all protected handoff paths.
- [ ] Stream emits canonical event taxonomy only.
- [ ] Mid-stream errors use required taxonomy and safe messages.
- [ ] Pre-stream errors use HTTP path; mid-stream errors use SSE `error`.
- [ ] Tool-call and tool-result IDs remain stable per interaction.
- [ ] `done` includes reconciliation identifiers and finish semantics.
- [ ] Approval remains contract-visible in interaction flow.
- [ ] Contract remains internal, not promoted to external API.
- [ ] Gateway and Engine can be swapped independently with contract compatibility.
