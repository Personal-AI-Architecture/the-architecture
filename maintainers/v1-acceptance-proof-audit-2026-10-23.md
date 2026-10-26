# PAA v1 acceptance proof audit — 2026-10-23

This is an audit of the 71 acceptance criteria in the PAA spec across 18 user stories. It separates a **published proof route** from an **observed pass**. A link to a specification or a language-neutral test tells an implementer what to prove; it does not mean a product passed that test.

`python3 scripts/check-acceptance-trace.py` finds 71 unique, contiguous criterion IDs: 69 name evidence routes and two record explicit scope/process decisions (AC-3.4 and AC-18.3). The repository link checker validates their local links. The contract and example checks and the executable conformance baseline verify the published package. The baseline has 11 checks after D197–D199; it does not execute all runtime scenarios against a product.

The [conformance runner instructions](../conformance/README.md) now include a tested compatible dependency set for package indexes that do not provide the primary `jsonschema` pin. Both sets run the same repository baseline; neither changes the target runtime proof still needed below.

| Story | Criteria checked | Published route or decision | Observed proof state |
| --- | --- | --- | --- |
| US-1 | AC-1.1–1.4 | Overview, principles, adapter and lock-in rules | Architecture published; target independence needs runtime proof. |
| US-2 | AC-2.1–2.4 | Memory spec, ARCH-1/9, write and conflict rules | Methods published; target Memory tests pending. |
| US-3 | AC-3.1–3.5 | Memory export, FS-1, Auth portability; AC-3.4 explicitly limits v1 to declared supported content | Methods and scope decision published; two-system transfer pending. |
| US-4 | AC-4.1–4.2 | FS-6, Memory and storage contracts | Methods published; target storage swap pending. |
| US-5 | AC-5.1–5.3 | SWAP-1/2, ARCH-5/19; D197 and canonical error-shape checks | Scoped by D200 for product proof. Controlled BrainDrive runtime swaps between listed models and profiles passed; a new adapter and local/cloud ability reporting remain unproved. |
| US-6 | AC-6.1–6.3 | Gateway spec, ARCH-3 and conversation tests | Methods published; client-switch and failure runtime cases pending. |
| US-7 | AC-7.1–7.4 | ARCH-2, internal contract, Auth separation and generic loop checks | Methods published; component replacement proof pending. |
| US-8 | AC-8.1–8.5 | SWAP-3, ARCH-20/21, Tools and Security specs | Scoped by D200 for product proof. Template MCP adapters have controlled discovery/call checks; a separate service call and refresh passed on a BrainDrive draft candidate. Same-named tools from two sources fail in BrainDrive; isolation and concurrency proof remain pending. |
| US-9 | AC-9.1–9.5 | DEPLOY-1–5, deployment contract | Repository checks cover contract text; platform/offline runtime proof pending. |
| US-10 | AC-10.1–10.5 | Auth/Security specs, ARCH-13, approval schemas and secrets rules | AC-10.4 corrected to the accepted fail-closed audit rule; target security tests pending. |
| US-11 | AC-11.1–11.4 | Deployment update and configuration override rules | Methods published; update/rollback runtime proof pending. |
| US-12 | AC-12.1–12.4 | README, documentation guide, repository link checker | Local links and docs checked in CI; visitor comprehension remains a review judgment. |
| US-13 | AC-13.1–13.4 | Contract tree, ARCH-4, schema/OpenAPI lint and canonical examples | Contract and example checks pass. Target payload proof is scoped by D200. BrainDrive's live Gateway route, structured request and text event checks fail against the canonical contract. |
| US-14 | AC-14.1–14.3 | Agent entry point, documentation guide, recorded bounded fresh-agent build | Dave W's independent TypeScript newcomer retest passed its five scoped criteria with a real provider; architecture-wide acceptance remains separate. |
| US-15 | AC-15.1–15.3 | TypeScript starter setup and its checks; shared validator across five templates | The rc.2 template candidates pin PAA `47d6471`; local shared validation and native checks pass. Accepted-main CI and Dave W's independent rc.2 run await PR #31 and tag. Full product conformance remains separate. |
| US-16 | AC-16.1–16.4 | Conformance index, test specifications, lock-in gates and executable baseline | Published suite and 11 baseline checks pass; target runtime suite pending. |
| US-17 | AC-17.1–17.5 | Customization spec, FS-2/8, tool-source adapter swap | Product proof is scoped by D200. Two owner instruction overlays changed controlled BrainDrive behavior; two products, branded client and new protocol support remain unproved. |
| US-18 | AC-18.1–18.4 | Contribution process, docs registry/freshness CI; AC-18.3 is an explicit accepted maintainer rule | Repository process checks pass; code/spec drift remains a review judgment on each change. |

The ranges above cover every AC ID exactly once. D200 explicitly scopes product-only proof out of the architecture v1 release gate; the target-runtime rows remain pending for product conformance and are not observed passes. This audit does **not** declare PAA v1 complete. The contract rename, template and validator repins, independent rc.2 newcomer check, both maintainers' sign-off, v1.0 tag and website update remain release gates. Dave W's [independent TypeScript newcomer retest](https://community.braindrive.ai/t/paa-repo-updates/373/41) passed its bounded earlier journey.

## BrainDrive product probe — 2026-10-26

The first product target was an isolated native BrainDrive Gateway from `dev`
commit `df735040e35c2b6e45d66b8c2b3a97c93d32807f`. Task-owned Memory and
secrets directories and two controlled loopback model providers kept the run
separate from owner data and live provider credentials. The reproducible probes
and the tool-source refresh and optional-outage fixes are in
[BrainDrive draft PR #350](https://github.com/BrainDriveAI/BrainDrive/pull/350).
The checks were run by the implementation maintainer; this is not Dave W's
independent acceptance run.

| Area | Observed result | Limit |
| --- | --- | --- |
| US-5, loaded profiles and models | Listed `mock-a` and `mock-b`; the next message used each selected model and then a second loaded provider profile, with no Gateway restart. A direct product factory check rejected `custom-adapter` as unsupported. | Controlled providers; an adapter-only install path, real local/cloud capability behavior and full SWAP-1/2 remain open. |
| US-8, separate service | A model-requested `auth_whoami` call went through the separate MCP service and returned to the model. A draft product change re-queried configured sources per turn; live add, call and remove worked without restart. An unavailable optional remote source was reported and the Gateway reached health 200 after the fix. | Two configured sources advertising `auth_whoami` caused startup failure, so ARCH-21 fails. Trust isolation, permission distinction and concurrent calls remain unproved. |
| US-13, live Gateway contract | `POST /conversations/messages` returned 404; a canonical content-part array sent to BrainDrive's `POST /message` returned 400; the text SSE event lacked the canonical `_event_type` and `content` fields. | These are contract failures, not accepted variations. Model API and internal payload capture/validation are still needed. |
| US-17, owner content | Switching between two instruction overlays changed the controlled model response without a code edit. A direct discovery check rejected `custom/new-protocol.json` as an unsupported tool source. | This is one product's owner customization, not the required two-product, branded-client or new-protocol proof. |

The product's remaining gaps are larger than these probes. Draft PR #350
records bounded progress and must not be treated as a full PAA conformance
result. The other audit rows above retain their pending states.
