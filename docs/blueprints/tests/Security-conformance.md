# Security Conformance Test Vectors

This file defines language-agnostic pass/fail vectors for cross-cutting Security boundary conformance.

## Requirement Set (MUST)

- `SEC-MUST-001`: Secrets must not be stored in normal inspectable Memory files or tracked configuration.
- `SEC-MUST-002`: Exposed error/event surfaces must use safe sanitized messages.
- `SEC-MUST-003`: Mid-stream error taxonomy must remain classified (`provider_error`, `tool_error`, `context_overflow`).
- `SEC-MUST-004`: Sensitive actions must be captured in structured audit logs.
- `SEC-MUST-005`: Approval enforcement must be coded control, not prompt-only guidance.
- `SEC-MUST-006`: Approval interaction must remain contract-visible where required.
- `SEC-MUST-007`: Protected request paths must enforce Auth and fail closed.
- `SEC-MUST-008`: Request payloads must not become hidden runtime/provider/tool reconfiguration channels.
- `SEC-MUST-009`: Tool scope/isolation boundaries must enforce limits independent of Auth policy alone.
- `SEC-MUST-010`: Product-owned auth state export must exclude credentials/secrets.
- `SEC-MUST-011`: Security controls must be present from day one of MVP operation.
- `SEC-MUST-012`: Correlation-aware traceability must exist for security-relevant operations.
- `SEC-MUST-013`: Memory export and version-history safety net guarantees must remain available.
- `SEC-MUST-014`: Security properties must survive component/adapter swaps without boundary erosion.

## Test Vectors

| Test ID | Requirement ID | Test Type | Input / Setup | Expected Output / Event / Error | Failure Signal | Drift Category |
|---|---|---|---|---|---|---|
| SEC-T001P | SEC-MUST-001 | Positive | Scan Memory/tracked config for secret fields/values | No raw credentials persisted in forbidden locations | Secret present in Memory/tracked config | Secret leakage |
| SEC-T001N | SEC-MUST-001 | Negative | Inject `api_key` into tracked config or normal Memory file | Conformance/security gate fails | Secret accepted | Credential persistence drift |
| SEC-T002P | SEC-MUST-002 | Positive | Trigger provider/tool failures and inspect client-visible errors | Safe normalized messages only | Raw stack/path/provider detail exposed | Unsafe output surface |
| SEC-T002N | SEC-MUST-002 | Negative | Forward raw exception string to stream/client | Conformance fails | Raw message accepted | Error sanitization drift |
| SEC-T003P | SEC-MUST-003 | Positive | Inject provider timeout/tool infra/context overflow failures | Error codes map to taxonomy | Code outside taxonomy | Taxonomy drift |
| SEC-T003N | SEC-MUST-003 | Negative | Collapse all failures to one generic code | Conformance fails | Collapsed taxonomy accepted | Error collapse drift |
| SEC-T004P | SEC-MUST-004 | Positive | Execute auth decision + tool read/write + startup phases | Structured audit events emitted | Missing audit entries | Audit coverage drift |
| SEC-T004N | SEC-MUST-004 | Negative | Disable audit sink for sensitive actions | Conformance fails | Missing audit accepted | Silent action drift |
| SEC-T005P | SEC-MUST-005 | Positive | Attempt write action requiring approval | Runtime blocks write until coded approval decision | Write executes without approval control | Prompt-only approval drift |
| SEC-T005N | SEC-MUST-005 | Negative | Remove approval interception logic, keep prompt text only | Conformance fails | Prompt-only behavior accepted | Enforcement bypass |
| SEC-T006P | SEC-MUST-006 | Positive | Approval-required interaction through Gateway/Engine contracts | `approval-request` + `approval-result` are contract-visible | Approval hidden in local UI path only | Contract invisibility |
| SEC-T006N | SEC-MUST-006 | Negative | Handle approval only inside CLI/local state | Conformance fails | Local-only approval accepted | Approval drift |
| SEC-T007P | SEC-MUST-007 | Positive | Call protected routes with valid auth context | Requests succeed under valid auth | Valid auth blocked unexpectedly | Auth regression |
| SEC-T007N | SEC-MUST-007 | Negative | Call protected routes without auth | 401/deny and no downstream execution | Unauthorized access allowed | Auth bypass |
| SEC-T008P | SEC-MUST-008 | Positive | Send bounded payload without config leakage | Request accepted | Legitimate request rejected due to false positives | Over-restrictive contract |
| SEC-T008N | SEC-MUST-008 | Negative | Send provider/model/tool/runtime metadata fields | Safe reject | Reconfiguration accepted | Hidden config channel |
| SEC-T009P | SEC-MUST-009 | Positive | Evaluate tool execution against configured scope/isolation profile | Out-of-scope access blocked by runtime boundary | Scope bypass possible when auth misconfigured | Boundary independence drift |
| SEC-T009N | SEC-MUST-009 | Negative | Disable tool runtime scope and rely only on auth allow/deny | Conformance fails | Auth-only boundary accepted | Isolation collapse |
| SEC-T010P | SEC-MUST-010 | Positive | Run auth export and inspect payload | Export includes non-secret auth state only | Credential or secret fields in export | Auth export leakage |
| SEC-T010N | SEC-MUST-010 | Negative | Include token/hash/secret in auth export response | Conformance fails | Secret-in-export accepted | Export secrecy drift |
| SEC-T011P | SEC-MUST-011 | Positive | Fresh startup path audit against MVP gates | Security controls present and active at startup | Security controls deferred/disabled until later | Day-one readiness drift |
| SEC-T011N | SEC-MUST-011 | Negative | Start system with approval/audit/safe-error controls disabled as post-MVP TODOs | Conformance fails | Deferred controls accepted | Hardening deferral drift |
| SEC-T012P | SEC-MUST-012 | Positive | Trace one request across gateway/auth/engine/tool/audit | Correlation IDs present and linked in events/logs | Untraceable sensitive operations | Traceability drift |
| SEC-T012N | SEC-MUST-012 | Negative | Strip correlation propagation before tool/audit layers | Conformance fails | Correlation loss accepted | Forensics gap drift |
| SEC-T013P | SEC-MUST-013 | Positive | Exercise memory export/history under normal operation | Export/history available and complete | Export/history unavailable | Recovery-net drift |
| SEC-T013N | SEC-MUST-013 | Negative | Disable version-history readiness or omit export path | Conformance fails | Missing recovery net accepted | Resilience drift |
| SEC-T014P | SEC-MUST-014 | Positive | Swap provider/adapter/component with contract compatibility | Security requirements remain satisfied after swap | Security control regression after swap | Swap regression drift |
| SEC-T014N | SEC-MUST-014 | Negative | Swap introduces raw errors, auth bypass, or secret leakage | Conformance fails | Security regression accepted | Boundary erosion |

## Coverage Summary

- MUST requirements: 14
- Positive tests: 14
- Negative tests: 14
- Total vectors: 28
- Critical drift categories covered: secret leakage, unsafe output surfaces, taxonomy collapse, audit gaps, approval bypass, auth bypass, config side-channel, isolation collapse, export leakage, day-one control deferral, traceability gaps, recovery-net erosion, swap-induced security regressions.
