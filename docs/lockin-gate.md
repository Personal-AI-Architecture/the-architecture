---
hide_table_of_contents: true
---

# Lock-In Gate (PR Checklist)

## Required Checks

- [ ] **Memory remains owner-portable:** changes do not trap owner data in proprietary or opaque formats.
- [ ] **Memory remains inspectable:** owner data can be inspected with standard tools when the system is not running.
- [ ] **No component-internal coupling added:** components interact only through defined contracts/interfaces.
- [ ] **No hardcoded provider/model/tool decisions in core code:** swap choices remain configuration-driven.
- [ ] **Adapter boundary preserved:** protocol/provider-specific behavior stays in adapters, not in Engine/Gateway/Auth core logic.
- [ ] **Config-only swap claim still true:** provider/model/tool swaps require config and adapter updates, not cross-component code edits.
- [ ] **Offline path still valid:** full loop can run without internet when configured with local model + local tools.
- [ ] **Local-first deployment still valid:** single-machine owner-controlled deployment remains supported.
- [ ] **Default network posture unchanged:** localhost-only by default; no automatic external exposure.
- [ ] **No new silent outbound traffic:** outbound calls occur only from explicitly configured network-dependent components.
- [ ] **No secrets in source or owner memory files:** secrets remain in env/secret infrastructure.
- [ ] **Update safety preserved:** change does not introduce data-loss or irreversible-upgrade risk.
- [ ] **Architecture boundary respected:** no implementation opinion is being baked into architecture behavior.
- [ ] **Documentation freshness verified:** `npm run check:docs` passes — all stale docs are updated in this PR.

---

## Evidence (Required)

- [ ] Link to tests or manual verification for offline/local path behavior (if impacted).
- [ ] Link to tests or manual verification for swap behavior (if adapters/config/provider/tooling impacted).
- [ ] Link to migration/update safety notes (if schema/storage/auth changed).

---

## Sign-Off

- [ ] PR author confirms all applicable checks passed.
- [ ] Reviewer confirms all applicable checks passed or approved exceptions are documented.

