# Tools Drift Guard

This document defines anti-drift controls for the Tools capability boundary.

## 1. Top Drift Patterns

- Tools promoted into a fifth architecture component.
- Introduction of a separate Tool API boundary.
- Tool execution logic moved outside Engine.
- Authorization logic embedded ad hoc in tool handlers or Gateway paths.
- Request payloads used to reconfigure tool sources/availability.
- Invalid tool definitions accepted without strict validation.
- Tool event shape drift (`tool-call`/`tool-result` mismatch).
- Approval modeled as prompt guidance rather than coded enforcement.
- Raw/unsafe tool failure messages leaked to client-visible surfaces.
- Direct component storage access bypassing tool-mediated memory boundary.
- Trust-level isolation controls absent for untrusted tools.
- Tool runtime failures swallowed silently.
- Tool swap requiring architecture rewrites.

## 2. Prohibited Implementation Shortcuts

- Creating a dedicated `Tools` subsystem component in architecture ownership.
- Adding standalone `/tools/*` execution APIs as a third contract surface.
- Executing tools directly from Gateway or client code paths.
- Skipping Auth checks because tool is marked `read_only`.
- Accepting tool source/definition overrides through request metadata.
- Registering tools without canonical schema checks.
- Executing mutating tools before explicit approval decision.
- Returning raw exceptions/stack traces in tool failure outputs.
- Letting components read/write Memory storage directly.
- Running untrusted tools in-process with unrestricted network/filesystem access.

## 3. Auto-Check Assertions

| Check ID | Assertion | Validation Mechanism | Severity |
|---|---|---|---|
| TOLD-CHK-001 | Tools are not modeled as standalone component | Architecture conformance checks | Critical |
| TOLD-CHK-002 | No separate Tool API boundary exists | Contract/API surface inspection | Critical |
| TOLD-CHK-003 | Tool execution occurs in Engine after Auth decision | Runtime path/integration tests | Critical |
| TOLD-CHK-004 | Tool availability derives from config + permissions only | Startup + permission tests | Critical |
| TOLD-CHK-005 | Request metadata cannot override tool sources/availability | Negative metadata tests | Critical |
| TOLD-CHK-006 | Tool definitions enforce canonical required/forbidden fields | Schema validation tests | Critical |
| TOLD-CHK-007 | Invalid sources/definitions fail before ready | Startup failure tests | Critical |
| TOLD-CHK-008 | `tool-call` and `tool-result` preserve stable IDs/shape | Stream contract tests | High |
| TOLD-CHK-009 | Approval-required mutations are blocked until decision | Approval flow tests | Critical |
| TOLD-CHK-010 | Tool failures are structured and sanitized | Error taxonomy/safety tests | Critical |
| TOLD-CHK-011 | Component memory access remains tool-mediated | Static + integration boundary tests | Critical |
| TOLD-CHK-012 | Trust-level isolation policy enforced for untrusted tools | Isolation policy tests | Critical |
| TOLD-CHK-013 | Tool timeout/unavailability/crash is surfaced explicitly | Failure-injection tests | High |
| TOLD-CHK-014 | Tool swap remains config/preference-only | Swap regression suite | Critical |

## 4. Contract-Break Indicators

- Tool definitions missing canonical fields are accepted.
- Stream emits tool-result without matching tool-call ID.
- Approval-request/result events missing for mutating operations.
- Tool failures expose internal stack traces, credentials, or raw payloads.
- Gateway/Engine/Auth directly access Memory storage without tools.
- Request metadata includes and accepts `tool_sources` overrides.
- Untrusted tools run with `in_process` or unrestricted network mode.
- Normal tool add/remove requires code rewrites in core components.

## 5. Fail Build If

- Any Critical check in section 3 fails.
- Any `TOL-MUST-*` conformance vector fails.
- Unsafe tool error leakage is detected.
- Approval bypass is possible for approval-required mutations.
- Direct component storage access bypasses tool boundary.
- Untrusted tool isolation policy requirements are violated.
- Unresolved High-risk conflict remains in Tools conflict register.

## 6. Drift Detection Checklist

- [ ] Tools are treated as capability surface, not standalone component.
- [ ] No separate Tool API boundary has been introduced.
- [ ] Engine executes tools; Auth authorizes usage.
- [ ] Tool availability is config + permission driven.
- [ ] Request metadata cannot reconfigure tool sources or visibility.
- [ ] Tool definitions validate against canonical schema.
- [ ] Startup fails clearly on unsupported/invalid tool sources.
- [ ] Tool-call and tool-result events preserve stable IDs.
- [ ] Approval gates block sensitive mutations until decision.
- [ ] Tool failures are classified and sanitized.
- [ ] Memory access remains tool-mediated for components.
- [ ] Trust-level isolation rules are enforced, especially for untrusted tools.
- [ ] Tool runtime failures are explicit, not silent.
- [ ] Tool add/remove swaps pass with config/preference changes only.
