# Acceptance criteria and proof routes

Use this trace with the [Personal AI Architecture specification](../spec/personal-ai-architecture-spec.md). A route defines how to collect proof. Record the target revision, outcome and evidence separately. Repository-scoped checks apply to PAA and its published templates.

US-14 and US-15 are retained as story placeholders. AC-16.2 and AC-18.4 moved to maintainer guidance. These identifiers and the criteria of the merged stories remain retired.

| Criterion | Scope | Proof route |
| --- | --- | --- |
| AC-1.1 | implementation | [ARCH-1](arch-tests.md#arch-1-memory-zero-dependencies), [ARCH-7](arch-tests.md#arch-7-memory-export), [FS-1](fs-tests.md#fs-1-move-your-memory), [FS-6](fs-tests.md#fs-6-evolve-memory) |
| AC-1.2 | implementation | [SWAP-1](swap-tests.md#swap-1-provider-swap), [SWAP-2](swap-tests.md#swap-2-model-swap), [SWAP-3](swap-tests.md#swap-3-tool-swap), [ARCH-2](arch-tests.md#arch-2-agent-loop-swap), [ARCH-3](arch-tests.md#arch-3-client-swap), [FS-7](fs-tests.md#fs-7-swap-agent-loop) |
| AC-1.3 | implementation | [FS-3](fs-tests.md#fs-3-run-on-own-hardware), [ARCH-26](arch-tests.md#arch-26-one-human-owner-and-explicit-grants), [DEPLOY-8](deploy-tests.md#deploy-8-owner-controls-updates-and-hosted-exit), [DEPLOY-11](deploy-tests.md#deploy-11-owner-defaults-and-changes-survive-an-update) |
| AC-1.4 | implementation | [FS-11](fs-tests.md#fs-11-boot-and-leave-without-required-vendor-software) |
| AC-2.1 | implementation | [ARCH-1](arch-tests.md#arch-1-memory-zero-dependencies) |
| AC-2.2 | implementation | [ARCH-1](arch-tests.md#arch-1-memory-zero-dependencies) |
| AC-2.3 | implementation | [ARCH-9](arch-tests.md#arch-9-version-history-reliability), [FS-6](fs-tests.md#fs-6-evolve-memory) |
| AC-2.4 | implementation | [ARCH-9](arch-tests.md#arch-9-version-history-reliability) |
| AC-2.5 | implementation | [FS-9](fs-tests.md#fs-9-owner-can-permanently-purge-selected-content) |
| AC-3.1 | implementation | [ARCH-7](arch-tests.md#arch-7-memory-export), [FS-1](fs-tests.md#fs-1-move-your-memory) |
| AC-3.2 | implementation | [FS-1](fs-tests.md#fs-1-move-your-memory) |
| AC-3.3 | implementation | [ARCH-18](arch-tests.md#arch-18-imported-grants-retain-identity-and-scope) |
| AC-3.4 | implementation | [FS-1](fs-tests.md#fs-1-move-your-memory) |
| AC-3.5 | implementation | [ARCH-7](arch-tests.md#arch-7-memory-export), [ARCH-29](arch-tests.md#arch-29-credentials-stay-within-their-binding) |
| AC-3.6 | implementation | [ARCH-8](arch-tests.md#arch-8-auth-tool-surface), [ARCH-11](arch-tests.md#arch-11-portable-audit-records), [ARCH-18](arch-tests.md#arch-18-imported-grants-retain-identity-and-scope) |
| AC-4.1 | implementation | [FS-6](fs-tests.md#fs-6-evolve-memory) |
| AC-4.2 | implementation | [FS-6](fs-tests.md#fs-6-evolve-memory), [ARCH-1](arch-tests.md#arch-1-memory-zero-dependencies) |
| AC-5.1 | implementation | [SWAP-2](swap-tests.md#swap-2-model-swap) |
| AC-5.2 | implementation | [SWAP-1](swap-tests.md#swap-1-provider-swap) |
| AC-5.3 | implementation | [ARCH-4](arch-tests.md#arch-4-schema-conformance), [ARCH-19](arch-tests.md#arch-19-unsupported-model-ability-is-reported) |
| AC-5.4 | implementation | [ARCH-5](arch-tests.md#arch-5-error-taxonomy-compliance), [SWAP-1](swap-tests.md#swap-1-provider-swap), [ARCH-12](arch-tests.md#arch-12-unsupported-adapter-cannot-start-silently) |
| AC-6.1 | implementation | [ARCH-3](arch-tests.md#arch-3-client-swap), [ARCH-24](arch-tests.md#arch-24-client-parity-and-owner-data-continuity) |
| AC-6.2 | implementation | [ARCH-4](arch-tests.md#arch-4-schema-conformance), [ARCH-24](arch-tests.md#arch-24-client-parity-and-owner-data-continuity) |
| AC-6.3 | implementation | [ARCH-24](arch-tests.md#arch-24-client-parity-and-owner-data-continuity) |
| AC-6.4 | implementation | [ARCH-17](arch-tests.md#arch-17-approval-decision-is-authorized-and-replay-safe), [ARCH-24](arch-tests.md#arch-24-client-parity-and-owner-data-continuity) |
| AC-6.5 | implementation | [ARCH-24](arch-tests.md#arch-24-client-parity-and-owner-data-continuity), [ARCH-15](arch-tests.md#arch-15-conversations-survive-gateway-restart) |
| AC-7.1 | implementation | [ARCH-2](arch-tests.md#arch-2-agent-loop-swap), [FS-7](fs-tests.md#fs-7-swap-agent-loop) |
| AC-7.2 | implementation | [ARCH-2](arch-tests.md#arch-2-agent-loop-swap), [ARCH-31](arch-tests.md#arch-31-data-and-metadata-do-not-grant-authority) |
| AC-7.3 | implementation | [ARCH-2](arch-tests.md#arch-2-agent-loop-swap), [ARCH-8](arch-tests.md#arch-8-auth-tool-surface) |
| AC-7.4 | implementation | [ARCH-2](arch-tests.md#arch-2-agent-loop-swap), [FS-10](fs-tests.md#fs-10-remove-product-additions-without-removing-owner-data) |
| AC-7.5 | implementation | [ARCH-23](arch-tests.md#arch-23-outside-connections-cross-owned-adapters) |
| AC-7.6 | implementation | [ARCH-32](arch-tests.md#arch-32-adapter-changes-and-contained-departures) |
| AC-8.1 | implementation | [SWAP-3](swap-tests.md#swap-3-tool-swap), [FS-8](fs-tests.md#fs-8-expand-scope-via-tools) |
| AC-8.2 | implementation | [ARCH-30](arch-tests.md#arch-30-tool-scope-and-catalog-ownership), [FS-8](fs-tests.md#fs-8-expand-scope-via-tools) |
| AC-8.3 | implementation | [ARCH-30](arch-tests.md#arch-30-tool-scope-and-catalog-ownership) |
| AC-8.4 | implementation | [ARCH-14](arch-tests.md#arch-14-assistant-text-survives-tool-continuation), [ARCH-20](arch-tests.md#arch-20-every-requested-tool-call-retains-its-identity) |
| AC-8.5 | implementation | [ARCH-16](arch-tests.md#arch-16-tool-isolation-follows-owner-trust) |
| AC-8.6 | implementation | [ARCH-30](arch-tests.md#arch-30-tool-scope-and-catalog-ownership) |
| AC-8.7 | implementation | [ARCH-21](arch-tests.md#arch-21-same-named-tools-retain-source-identity), [ARCH-30](arch-tests.md#arch-30-tool-scope-and-catalog-ownership) |
| AC-9.1 | implementation | [FS-3](fs-tests.md#fs-3-run-on-own-hardware) |
| AC-9.2 | implementation | [DEPLOY-1](deploy-tests.md#deploy-1-offline-operation) |
| AC-9.3 | implementation | [DEPLOY-3](deploy-tests.md#deploy-3-default-localhost) |
| AC-9.4 | implementation | [DEPLOY-2](deploy-tests.md#deploy-2-local-data-storage), [DEPLOY-4](deploy-tests.md#deploy-4-no-silent-outbound), [DEPLOY-5](deploy-tests.md#deploy-5-no-unconfigured-outbound-during-operation), [ARCH-25](arch-tests.md#arch-25-model-destination-disclosure-and-provenance) |
| AC-9.5 | implementation | [FS-3](fs-tests.md#fs-3-run-on-own-hardware) |
| AC-9.6 | implementation | [DEPLOY-6](deploy-tests.md#deploy-6-genuine-release-verification) |
| AC-9.7 | implementation | [ARCH-25](arch-tests.md#arch-25-model-destination-disclosure-and-provenance) |
| AC-9.8 | implementation | [DEPLOY-10](deploy-tests.md#deploy-10-cross-machine-connections-are-protected) |
| AC-10.1 | implementation | [ARCH-26](arch-tests.md#arch-26-one-human-owner-and-explicit-grants) |
| AC-10.2 | implementation | [ARCH-17](arch-tests.md#arch-17-approval-decision-is-authorized-and-replay-safe), [ARCH-26](arch-tests.md#arch-26-one-human-owner-and-explicit-grants) |
| AC-10.3 | implementation | [ARCH-26](arch-tests.md#arch-26-one-human-owner-and-explicit-grants) |
| AC-10.4 | implementation | [ARCH-11](arch-tests.md#arch-11-portable-audit-records), [ARCH-13](arch-tests.md#arch-13-audit-sink-failure-is-visible-to-the-owner) |
| AC-10.5 | implementation | [ARCH-7](arch-tests.md#arch-7-memory-export), [ARCH-29](arch-tests.md#arch-29-credentials-stay-within-their-binding) |
| AC-10.6 | implementation | [ARCH-31](arch-tests.md#arch-31-data-and-metadata-do-not-grant-authority) |
| AC-10.7 | implementation | [ARCH-26](arch-tests.md#arch-26-one-human-owner-and-explicit-grants), [ARCH-31](arch-tests.md#arch-31-data-and-metadata-do-not-grant-authority) |
| AC-10.8 | implementation | [ARCH-11](arch-tests.md#arch-11-portable-audit-records) |
| AC-10.9 | implementation | [ARCH-10](arch-tests.md#arch-10-revocation-cancellation) |
| AC-10.10 | implementation | [ARCH-27](arch-tests.md#arch-27-local-login-recovery-preserves-vault-controls) |
| AC-10.11 | implementation | [ARCH-28](arch-tests.md#arch-28-auth-outage-fails-closed) |
| AC-10.12 | implementation | [ARCH-29](arch-tests.md#arch-29-credentials-stay-within-their-binding) |
| AC-11.1 | implementation | [DEPLOY-11](deploy-tests.md#deploy-11-owner-defaults-and-changes-survive-an-update) |
| AC-11.2 | implementation | [DEPLOY-7](deploy-tests.md#deploy-7-broken-update-rollback-with-data-intact) |
| AC-11.3 | implementation | [DEPLOY-11](deploy-tests.md#deploy-11-owner-defaults-and-changes-survive-an-update) |
| AC-11.4 | implementation | [DEPLOY-11](deploy-tests.md#deploy-11-owner-defaults-and-changes-survive-an-update) |
| AC-11.5 | implementation | [DEPLOY-8](deploy-tests.md#deploy-8-owner-controls-updates-and-hosted-exit) |
| AC-11.6 | implementation | [DEPLOY-9](deploy-tests.md#deploy-9-default-uninstall-preserves-owner-data) |
| AC-12.1 | repo | [ARCH-33](arch-tests.md#arch-33-repository-discovery-and-build) |
| AC-12.2 | repo | [ARCH-33](arch-tests.md#arch-33-repository-discovery-and-build) |
| AC-12.3 | repo | [ARCH-33](arch-tests.md#arch-33-repository-discovery-and-build) |
| AC-12.4 | repo | [ARCH-33](arch-tests.md#arch-33-repository-discovery-and-build) |
| AC-12.5 | repo | [ARCH-33](arch-tests.md#arch-33-repository-discovery-and-build) |
| AC-12.6 | repo | [ARCH-33](arch-tests.md#arch-33-repository-discovery-and-build) |
| AC-13.1 | repo | [ARCH-34](arch-tests.md#arch-34-repository-contract-and-example-authority) |
| AC-13.2 | repo | [ARCH-34](arch-tests.md#arch-34-repository-contract-and-example-authority) |
| AC-13.3 | repo | [ARCH-34](arch-tests.md#arch-34-repository-contract-and-example-authority) |
| AC-16.1 | repo | [ARCH-35](arch-tests.md#arch-35-repository-review-and-conformance-reporting) |
| AC-16.3 | repo | [ARCH-35](arch-tests.md#arch-35-repository-review-and-conformance-reporting) |
| AC-16.4 | repo | [ARCH-35](arch-tests.md#arch-35-repository-review-and-conformance-reporting) |
| AC-17.1 | implementation | [FS-10](fs-tests.md#fs-10-remove-product-additions-without-removing-owner-data) |
| AC-17.2 | implementation | [FS-10](fs-tests.md#fs-10-remove-product-additions-without-removing-owner-data) |
| AC-17.3 | implementation | [FS-8](fs-tests.md#fs-8-expand-scope-via-tools), [SWAP-3](swap-tests.md#swap-3-tool-swap) |
| AC-17.4 | implementation | [ARCH-24](arch-tests.md#arch-24-client-parity-and-owner-data-continuity) |
| AC-17.5 | repo | [ARCH-33](arch-tests.md#arch-33-repository-discovery-and-build) |
| AC-17.6 | implementation | [FS-10](fs-tests.md#fs-10-remove-product-additions-without-removing-owner-data) |
| AC-18.1 | repo | [ARCH-35](arch-tests.md#arch-35-repository-review-and-conformance-reporting) |
| AC-18.2 | repo | [ARCH-35](arch-tests.md#arch-35-repository-review-and-conformance-reporting) |
| AC-18.3 | repo | [ARCH-35](arch-tests.md#arch-35-repository-review-and-conformance-reporting) |
| AC-18.5 | implementation | [ARCH-32](arch-tests.md#arch-32-adapter-changes-and-contained-departures) |
