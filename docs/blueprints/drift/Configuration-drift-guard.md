# Configuration Drift Guard

This document defines anti-drift controls for Configuration boundary implementations.

## 1. Top Drift Patterns

- Runtime config, adapter config, and preferences merged into one loader.
- Request metadata used as runtime/provider/tool configuration channel.
- Raw secrets stored in tracked config or Memory preference files.
- Runtime config bloats with preference-owned or provider-owned fields.
- Adapter config carries cross-layer ownership data.
- Preferences move outside Memory ownership.
- Startup phases occur out of order or `ready` is emitted too early.
- Unsupported adapters/sources are silently accepted.
- Model/provider swap requires code edits instead of config changes.
- Unsafe bind defaults expose runtime unexpectedly.
- Startup readiness omits day-one auth/persistence/export prerequisites.
- Legacy fallback behavior becomes undocumented hidden behavior.

## 2. Prohibited Implementation Shortcuts

- One generic config object for runtime + adapter + preferences + secrets.
- Accepting `provider`, `model`, `tool_sources`, or secret fields from request metadata.
- Persisting `api_key`, `token`, or `password` in tracked files.
- Putting `default_model` or `approval_mode` in runtime config.
- Hardcoding adapter/provider selection in runtime code.
- Silent fallback on unsupported tool source or adapter key.
- Declaring startup ready before canonical phase completion.

## 3. Auto-Check Assertions

| Check ID | Assertion | Validation Mechanism | Severity |
|---|---|---|---|
| CFGD-CHK-001 | Layer separation enforced | Static and runtime loader tests (`runtime`, `adapter`, `preferences`) | Critical |
| CFGD-CHK-002 | Request metadata cannot reconfigure runtime/provider/tools | Gateway metadata negative tests | Critical |
| CFGD-CHK-003 | Secret-by-value fields rejected | Config schema validation + content scans | Critical |
| CFGD-CHK-004 | Runtime config remains thin and environment-owned | Runtime schema + forbidden field tests | Critical |
| CFGD-CHK-005 | Adapter config remains provider-specific and reference-only | Adapter schema tests | Critical |
| CFGD-CHK-006 | Preferences remain Memory-owned | Startup and storage path tests | Critical |
| CFGD-CHK-007 | Startup sequence order is deterministic | Startup phase event assertions | Critical |
| CFGD-CHK-008 | Invalid/unsupported configuration fails clearly | Startup failure tests | Critical |
| CFGD-CHK-009 | Tool discovery derives from configured sources only | Tool-source discovery tests | High |
| CFGD-CHK-010 | Same-provider model swap is preference-only | Swap conformance tests | High |
| CFGD-CHK-011 | Provider swap is adapter/runtime-config-only | Swap conformance tests | Critical |
| CFGD-CHK-012 | Localhost-first default bind posture holds unless explicit override | Runtime config default tests | High |
| CFGD-CHK-013 | Day-one readiness surfaces are present | Startup readiness integration tests | Critical |
| CFGD-CHK-014 | Anti-lock-in swap suite passes with config-only edits | CI swap gate | Critical |

## 4. Contract-Break Indicators

- Runtime file contains preference or secret fields by value.
- Request accepted despite metadata containing config-like fields.
- `ready` emitted before tools/memory/preferences initialization.
- Unsupported adapter/source does not fail startup.
- Same-provider model change requires code edits.
- Provider swap requires Gateway/Engine rewrite.
- Runtime defaults expose non-localhost bind unintentionally.

## 5. Fail Build If

- Any Critical check in section 3 fails.
- Any `CFG-MUST-*` conformance vector fails.
- Secret-by-value field detected in tracked configuration or Memory preferences.
- Startup sequence or readiness gates are violated.
- Provider/model/tool swap requires code changes.
- Unresolved High-risk conflict remains in Configuration conflict register.

## 6. Drift Detection Checklist

- [ ] Runtime, adapter, and preferences layers are separate.
- [ ] Request metadata cannot override runtime/provider/tool decisions.
- [ ] Secrets are reference-only in config surfaces.
- [ ] Runtime config remains thin and environment-owned.
- [ ] Adapter config remains provider-specific.
- [ ] Preferences remain owner-owned in Memory.
- [ ] Startup order matches canonical six-phase sequence.
- [ ] Invalid/unsupported config fails clearly.
- [ ] Tool discovery is sourced from configured tool sources only.
- [ ] Same-provider model swap works through preference change only.
- [ ] Provider swap works through adapter/runtime config only.
- [ ] Localhost-first bind default is preserved unless overridden.
- [ ] Day-one readiness surfaces are available.
- [ ] Anti-lock-in swap suite passes with config-only edits.
