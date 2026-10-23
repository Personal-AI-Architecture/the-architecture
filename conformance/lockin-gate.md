# Lock-In Gate (PR Checklist)

## Required Checks

- [ ] **Memory remains owner-portable:** changes do not trap owner data in proprietary or opaque formats.
- [ ] **Memory remains inspectable:** owner data can be inspected with standard tools when the system is not running.
- [ ] **No component-internal coupling added:** components interact only through defined contracts/interfaces.
- [ ] **No hardcoded provider/model/tool decisions in core code:** swap choices remain configuration-driven.
- [ ] **Adapter boundary preserved:** protocol/provider-specific behavior stays in adapters, not in Agent Loop/Gateway/Auth core logic.
- [ ] **Invalid adapter fails clearly:** an unknown or invalid selected adapter never becomes a silently substituted provider; use ARCH-12 when adapter startup changes.
- [ ] **Config-only swap claim still true:** model swaps and switches between listed provider profiles are preference changes (D193); a provider in a new format or a tool swap requires config and adapter updates; none requires cross-component code edits.
- [ ] **Offline path still valid:** full loop can run without internet when configured with local model + local tools.
- [ ] **Local-first deployment still valid:** single-machine owner-controlled deployment remains supported.
- [ ] **Default network posture unchanged:** localhost-only by default; no automatic external exposure.
- [ ] **No new silent outbound traffic:** outbound calls occur only from explicitly configured network-dependent components.
- [ ] **No secrets in Your Memory or git-tracked files:** secrets stay in environment variables, an untracked config file, or a secret store.
- [ ] **Update safety preserved:** change does not introduce data-loss or irreversible-upgrade risk.
- [ ] **Architecture boundary respected:** no implementation opinion is being baked into architecture behavior.
- [ ] **Documentation freshness verified:** `python3 scripts/check-docs.py` passes — all stale docs are updated in this PR.

---

## Evidence (Required)

- [ ] Link to tests or manual verification for offline/local path behavior (if impacted).
- [ ] Link to tests or manual verification for swap behavior (if adapters/config/provider/tooling impacted).
- [ ] Link to migration/update safety notes (if schema/storage/auth changed).

---

## Sign-Off

- [ ] PR author confirms all applicable checks passed.
- [ ] Reviewer confirms all applicable checks passed or approved exceptions are documented.

