# PAA v1 acceptance proof audit — 2026-10-23

This is an audit of the 71 acceptance criteria in the PAA spec across 18 user stories. It separates a **published proof route** from an **observed pass**. A link to a specification or a language-neutral test tells an implementer what to prove; it does not mean a product passed that test.

`python3 scripts/check-acceptance-trace.py` finds 71 unique, contiguous criterion IDs: 69 name evidence routes and two record explicit scope/process decisions (AC-3.4 and AC-18.3). The repository link checker validates their local links. The contract and example checks and the executable conformance baseline verify the published package. The baseline has 11 checks after D197–D199; it does not execute all runtime scenarios against a product.

| Story | Criteria checked | Published route or decision | Observed proof state |
| --- | --- | --- | --- |
| US-1 | AC-1.1–1.4 | Overview, principles, adapter and lock-in rules | Architecture published; target independence needs runtime proof. |
| US-2 | AC-2.1–2.4 | Memory spec, ARCH-1/9, write and conflict rules | Methods published; target Memory tests pending. |
| US-3 | AC-3.1–3.5 | Memory export, FS-1, Auth portability; AC-3.4 explicitly limits v1 to declared supported content | Methods and scope decision published; two-system transfer pending. |
| US-4 | AC-4.1–4.2 | FS-6, Memory and storage contracts | Methods published; target storage swap pending. |
| US-5 | AC-5.1–5.3 | SWAP-1/2, ARCH-5/19; D197 and canonical error-shape checks | Contract checks pass; model/provider runtime cases pending. |
| US-6 | AC-6.1–6.3 | Gateway spec, ARCH-3 and conversation tests | Methods published; client-switch and failure runtime cases pending. |
| US-7 | AC-7.1–7.4 | ARCH-2, internal contract, Auth separation and generic loop checks | Methods published; component replacement proof pending. |
| US-8 | AC-8.1–8.5 | SWAP-3, ARCH-20/21, Tools and Security specs | GAP-PAA-29's separate-service method still awaits the joint D196 decision in PR #21; runtime tests pending. |
| US-9 | AC-9.1–9.5 | DEPLOY-1–5, deployment contract | Repository checks cover contract text; platform/offline runtime proof pending. |
| US-10 | AC-10.1–10.5 | Auth/Security specs, ARCH-13, approval schemas and secrets rules | AC-10.4 corrected to the accepted fail-closed audit rule; target security tests pending. |
| US-11 | AC-11.1–11.4 | Deployment update and configuration override rules | Methods published; update/rollback runtime proof pending. |
| US-12 | AC-12.1–12.4 | README, documentation guide, repository link checker | Local links and docs checked in CI; visitor comprehension remains a review judgment. |
| US-13 | AC-13.1–13.4 | Contract tree, ARCH-4, schema/OpenAPI lint and canonical examples | Repository contract and example checks pass; target payload validation pending. |
| US-14 | AC-14.1–14.3 | Agent entry point, documentation guide, recorded bounded fresh-agent build | Bounded build passed; Dave W's final independent build from the v1 candidate remains pending. |
| US-15 | AC-15.1–15.3 | TypeScript starter setup and its checks; shared validator across five templates | Templates passed at the prior PAA contract pin. D197–D199 change contracts, so affected templates must be repinned and retested before current-main readiness is renewed. |
| US-16 | AC-16.1–16.4 | Conformance index, test specifications, lock-in gates and executable baseline | Published suite and 11 baseline checks pass; target runtime suite pending. |
| US-17 | AC-17.1–17.5 | Customization spec, FS-2/8, tool-source adapter swap | Methods published; product-specific customization and new-protocol runtime proof pending. |
| US-18 | AC-18.1–18.4 | Contribution process, docs registry/freshness CI; AC-18.3 is an explicit accepted maintainer rule | Repository process checks pass; code/spec drift remains a review judgment on each change. |

The ranges above cover every AC ID exactly once. This audit does **not** declare PAA v1 complete. Before sign-off: settle GAP-PAA-29; review and merge D197–D199 with the corrected AC-10.4; repin and rerun affected templates; run Dave W's final independent build; and record the runtime conformance results or explicit scope decisions for criteria whose method is published but whose outcome is still unobserved.
