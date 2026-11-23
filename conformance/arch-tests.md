# Architectural Invariant Tests

> Validates component boundaries, independence, and structural properties of the architecture.

---

## ARCH-1: Memory Zero Dependencies

**Validates:** Principle 1 (Memory is the platform), architecture overview §1. Make Your Memory the platform

**Setup:**
1. System running with data in Your Memory (files, conversations, preferences)
2. All components operational

**Procedure:**
1. Stop the Agent Loop process
2. Stop the Gateway process
3. Stop Auth
4. Stop all tool servers / MCP processes
5. Attempt to read Your Memory content using standard tools

**Pass criteria:**
- [ ] Ordinary files are readable with standard tools, and protected data can be opened with owner-controlled unlock material
- [ ] Structured data (for example, conversations in a database) is readable with a standard viewer for its open format
- [ ] Version history is browsable with standard tools for its format (for example, git commands if the implementation uses Git)
- [ ] No component needs to be running to access Your Memory
- [ ] Content makes sense to a human reader without the system

**Failure indicators:**
- Files are in a proprietary format that requires the system to decode
- Data is encrypted with keys that only the running system can access
- Content requires a specific tool or service to be readable
- Any file in Your Memory has a binary format without a standard reader

---

## ARCH-2: Agent Loop Swap

**Validates:** D39 (Agent Loop is generic), FS-7 (Swap the Agent Loop)

**Setup:**
1. System running with Agent Loop Implementation A
2. Test conversation completing successfully
3. Agent Loop Implementation B available (different codebase, same contract)

**Procedure:**
1. Stop the system
2. Replace Agent Loop A binary/container with Agent Loop B
3. Keep all other components, config, Your Memory, tools unchanged
4. Start the system
5. Run the same test conversation

**Pass criteria:**
- [ ] Test conversation completes successfully with Agent Loop B
- [ ] Gateway operates identically — same conversation management
- [ ] Auth operates identically — same authentication/authorization
- [ ] Your Memory is unchanged — same files, same data
- [ ] Tools work identically — same tool calls succeed
- [ ] Clients connect identically — same Gateway API
- [ ] Only the Agent Loop binary/container was changed

**Failure indicators:**
- Gateway needed modification to work with Agent Loop B
- Auth needed modification
- Tool definitions or configurations needed changes
- Your Memory format was incompatible
- Clients needed updates

---

## ARCH-3: Client Swap

**Validates:** D57 (clients are external), FS-5 (Swap the client)

**Setup:**
1. System running with Client A (e.g., web app)
2. Active conversation with history

**Procedure:**
1. Build Client B (e.g., CLI) that speaks the Gateway API
2. Connect Client B to the same Gateway
3. Resume the existing conversation from Client B

**Pass criteria:**
- [ ] Client B connects successfully through the Gateway API
- [ ] Client B can list existing conversations
- [ ] Client B can resume the conversation started by Client A
- [ ] Full conversation history is available
- [ ] New messages from Client B are processed identically
- [ ] The system has no knowledge of which client is connected
- [ ] Zero changes to Gateway, Agent Loop, Auth, Your Memory, or tools

**Failure indicators:**
- The Gateway needed to know about Client B
- Client-specific logic exists in any component
- Conversation history was not available to the new client
- The system behaved differently based on which client was connected

---

## ARCH-4: Schema Conformance

**Validates:** The published [Gateway API](../contracts/openapi/gateway-api.yaml) and [Model API](../contracts/openapi/model-api.yaml), including D199 extensions.

**Setup:** Run a target with message traffic, tool calls and errors. Exercise approvals if supported. Locate the PAA-facing side of each public API adapter.

**Procedure:** Capture requests, responses and stream events at the Gateway API after client-format translation and at the Model API before provider-format translation. Validate the request, status, payload and event shape against the corresponding public contract. Exercise an unknown additive extension and an invalid core field.

**Pass criteria:**
- [ ] Captured public traffic uses the canonical routes, shapes and event types.
- [ ] Extension fields stay in the designated maps and cannot override identity, permission or other core semantics.
- [ ] Internal component payloads are evaluated separately in the component swap checks. If an implementation uses the published Gateway ↔ Agent Loop contract internally, validate that traffic against its published schema.

**Failure indicators:** Public payloads require an undocumented field, take authority from an extension, or expose a provider-specific shape on the PAA-facing side.

---

## ARCH-5: Error Taxonomy Compliance

**Validates:** gateway-agent-loop-contract.md §Mid-Stream Errors, agent-loop-spec.md §Error output

**Setup:**
1. System running with active traffic
2. Ability to trigger provider failures, tool failures, Auth failures, and context overflow conditions

**Procedure:**
1. Trigger a model/network failure (e.g., invalid provider URL)
2. Trigger an unrecoverable tool execution failure (e.g., tool executor crash)
3. Trigger an Auth failure (e.g., Auth unavailable or a request denied by Auth)
4. Trigger a context overflow (e.g., send messages exceeding model context window)
5. Select an unavailable model, then a model that lacks a requested ability such as image input
6. Capture the Model API, Agent Loop and Gateway API errors emitted in each case
7. Repeat a provider failure with an owner-approved fallback configured and a second candidate the owner did not approve. Record actual destinations and the producer of any saved reply.

**Pass criteria:**
- [ ] Provider/network failure emits `provider_error`
- [ ] An unavailable selected model emits `model_unavailable` through Model API, Agent Loop and Gateway API; no other model or provider is selected (D197)
- [ ] An unsupported ability emits `capability_unsupported` with a machine-readable `capability` through all three boundaries; no content is silently dropped (D197)
- [ ] If the Agent Loop retries a provider call, it records no more than one retry on the same selected model and provider profile. An optional fallback uses only a model and provider the owner set up. A failure that remains emits `provider_error` (D205).
- [ ] Unrecoverable tool failure emits `tool_error`
- [ ] Auth failure emits `auth_error`
- [ ] Context overflow emits `context_overflow`
- [ ] No catch-all error code used for all failure types
- [ ] Recoverable tool failures (tool returns an error result) go back to the model as `tool-result` events, not as stream-fatal `error` events

**Context-window cases:** Resume a conversation long enough to exceed the safe
budget for the selected provider and model. Verify the Gateway keeps full history,
selects complete older turns, optionally builds a deterministic summary without
a model call, and emits `context_notice` before model output whenever any turn
was left out. The summary must
be Gateway-labelled `context_data`, distinct from the owner message and the
Agent Loop's bootstrap instruction. Switch provider or model and
verify the next budget changes from that profile's model limit without rewriting
history. Select a pair with no safe limit and verify `context_limit_unknown`
before dispatch. Send an oversized current message and verify a Gateway API
`context_overflow` response rather than truncation. Finally, return a live tool
result that makes a continuation too large: the Agent Loop must emit
`context_overflow`, preserve the original result in history, and never send a
silently shortened result to the model.

**BrainDrive implementation gap:** The current BrainDrive Gateway cuts replayed
tool-result text at 4,000 characters. Add a product case with a historical tool
result longer than 4,000 characters. It must verify that the full result is saved
and, when its turn is selected for replay, sent unchanged; the Gateway may omit
the entire old turn with a `context_notice` instead. A partial replayed result
fails this rule. The current behavior is an observed gap, not a PAA allowance.

**Failure indicators:**
- All errors emit the same code regardless of cause
- An unavailable model or unsupported ability is collapsed into a generic `provider_error`, or the missing ability is not named
- Tool execution errors that the model could recover from terminate the stream
- Context overflow is reported as `provider_error`

---

## ARCH-6: Error Message Sanitization

**Validates:** gateway-agent-loop-contract.md §Checking an implementation, security-spec.md

**Setup:**
1. System running with various failure conditions triggerable

**Procedure:**
1. Trigger errors that would produce stack traces, file paths, or credential references internally
2. Capture the SSE error events
3. Inspect the `message` field of each error event

**Pass criteria:**
- [ ] No SSE error event `message` contains file system paths
- [ ] No SSE error event `message` contains stack traces
- [ ] No SSE error event `message` contains credentials, tokens, or API keys
- [ ] All error messages are safe for display to end users
- [ ] Raw diagnostic detail is available in structured stdout logs (not in the stream)

**Failure indicators:**
- Error messages contain `/home/...`, `/usr/...`, or similar paths
- Error messages contain `at Object.<anonymous>` or similar stack frames
- Error messages contain API keys or tokens

---

## ARCH-7: Memory Export

**Validates:** memory-spec.md §Export, security-spec.md §Export Security

**Setup:**
1. System running with data in Your Memory (files, conversations, preferences, version history)

**Procedure:**
1. Invoke the `memory_export` tool (or equivalent export mechanism)
2. Stop the system
3. Inspect the exported archive with standard tools

**Pass criteria:**
- [ ] Export produces a complete archive of all owned Memory data
- [ ] Archive is in an open format (tar, zip, or equivalent)
- [ ] Ordinary files are readable with standard tools. The owner can unlock protected data with their own material.
- [ ] Version history is included or reproducible
- [ ] Conversations are included in the export
- [ ] Saved credentials appear only in a form that requires independent owner-controlled unlock material. The export alone cannot recover them. Active sessions are excluded.
- [ ] Archive is readable without the system running

**Failure indicators:**
- Export is missing files, conversations, or version history
- Export exposes a readable credential, contains the unprotected means to unlock it, or transfers an active session
- Export format requires the system to decode

---

## ARCH-8: Auth Tool Surface

**Validates:** AC-3.6, AC-7.3 and [Auth tools and portability](../architecture/auth-spec.md#data-portability).

**Setup:**
1. System running with Auth configured (any mode, including local owner)
2. Representative identities, permission rules, approval rules and audit records
3. A second Auth provider with an adapter for the same boundary

**Procedure:**
1. Call `auth_whoami` tool
2. Call `auth_check` tool with a known resource/action
3. Call `auth_export` tool
4. Replace only Auth and repeat the inspection and execution. Check the portable records and the Gateway behavior against the originals.

**Pass criteria:**
- [ ] `auth_whoami` returns current actor identity (type, ID)
- [ ] `auth_check` returns a permission decision (allow/deny) for the given resource/action
- [ ] `auth_export` returns readable identities, permission and approval rules, and audit records without credential values
- [ ] All three tools are registered and discoverable alongside memory tools
- [ ] The Gateway continues using the same Auth boundary and the replacement retains and enforces existing Auth state.

**Failure indicators:**
- Any of the three tools is missing from the tool registry
- `auth_whoami` returns empty or error
- `auth_export` includes credentials or secrets

---

## ARCH-9: Version History Reliability

**Validates:** memory-spec.md §What Your Memory guarantees, security-spec.md §6. Version History as Security Net

**Setup:**
1. Fresh system install (no prior data)

**Procedure:**
1. Start the system for the first time
2. Write a file to Your Memory
3. Modify the file
4. Call the memory history operation on the file (whatever the implementation names it)
5. Request a previous state using the returned version identifier
6. Restore that previous state, then read the file
7. Exercise a failed write and simultaneous conflicting writes to the same artifact. Check the resulting content and recoverable history.

**Pass criteria:**
- [ ] System starts successfully on first run with version history initialized
- [ ] The history operation returns at least two change records (create + modify)
- [ ] Previous state is retrievable and matches the original file content
- [ ] A failed or conflicting write is reported. Simultaneous changes leave valid content and history.
- [ ] After the restore, the file's current content matches the original, and the history still shows the modification
- [ ] If version history cannot be initialized at startup, the system fails with a clear error (not a warning)

**Failure indicators:**
- System starts but version history silently fails
- The history operation returns only metadata without access to previous states
- There is no way to make an earlier state current again
- First-run initialization produces warnings instead of deterministic setup

---

## ARCH-10: Revocation Cancellation

**Validates:** [auth-spec.md](../architecture/auth-spec.md) §Access revoked during an operation and `POST /agent-loop/cancel`

**Setup:**
1. Start a turn for a non-owner actor that will make model and tool calls
2. Keep the turn active while the owner revokes that actor

**Procedure:**
1. Revoke the actor in Auth
2. Send `POST /agent-loop/cancel` with the active request's `correlation_id` and `reason=auth_revoked`
3. Observe the stream and tool runtime

**Pass criteria:**
- [ ] Cancellation targets only the matching correlation ID
- [ ] The active loop stops and emits `auth_error`
- [ ] No model or tool work starts after cancellation is observed
- [ ] Supported in-flight work is cancelled and writes not yet committed are discarded
- [ ] Repeating cancellation is idempotent and does not restart work
- [ ] The revocation, cancellation, and stopped operation are present in the audit log

**Failure indicators:**
- The revoked actor can continue making tool calls
- Cancellation affects another request or conversation
- The system silently retries under the revoked identity

---

## ARCH-11: Portable Audit Records

**Validates:** [audit-record.json](../contracts/schemas/audit-record.json), US-10 AC-10.4

**Setup:**
1. Produce an allowed action, a denied action, a tool call, and an identity or permission change

**Procedure:**
1. Export or query the audit log
2. Validate each record against `contracts/schemas/audit-record.json`
3. Inspect records without implementation-specific decoding

**Pass criteria:**
- [ ] Every action has the required portable audit fields
- [ ] `actor_id` is the authenticated actor of the originating request
- [ ] Correlation IDs connect records to the originating request or operation
- [ ] Records contain no credentials, secrets, or raw private content
- [ ] The owner can query and export the records in an open format

**Failure indicators:**
- Auth, tool, Memory, or revocation actions are missing from the log
- Audit records require a provider-specific schema to interpret
- Secrets or raw private content are stored in records

---

## ARCH-12: Unsupported Adapter Cannot Start Silently

**Validates:** [configuration-spec.md](../architecture/configuration-spec.md) §At startup, [adapter-spec.md](../architecture/adapter-spec.md) §Swapping providers

**Setup:** A working local installation with a known adapter and a valid runtime configuration. No provider network access is needed.

**Procedure:**
1. Change only `provider_adapter` to the name of an adapter that is not installed and start the system.
2. Restore the known adapter name, give it invalid local adapter configuration, and start the system again.
3. Restore valid configuration, then make its remote provider unreachable and start the system.

**Pass criteria:**
- [ ] In steps 1 and 2, startup identifies the configuration error and never reports the system ready.
- [ ] No other adapter or provider is selected silently in steps 1 and 2.
- [ ] In step 3, remote unavailability does not prevent local startup; the unavailable provider is reported when its use is attempted.

**Failure indicators:** An unknown adapter silently maps to a default, invalid local configuration is accepted as ready, or mere lack of network access blocks local startup.

---

<a id="arch-13-audit-sink-failure-stops-audited-actions"></a>

## ARCH-13: Audit Sink Failure Is Visible To The Owner

**Validates:** AC-10.4 and [Audit logging](../architecture/auth-spec.md#audit-log).

**Setup:** A target with an audit sink that can be made temporarily unavailable.

**Procedure:** Confirm an ordinary tool action is recorded. Disable the sink, request a tool action, inspect owner feedback and reported results, then restore the sink and inspect the audit trail.

**Pass criteria:**
- [ ] The owner is told about the outage.
- [ ] Any actions carried out during it are reported as audited only if durably recorded.
- [ ] The outage is recorded once the sink can write again.
- [ ] The run records whether the implementation chose to stop or continue work.

**Failure indicators:** The outage is hidden or action is reported as audited without a record.

---

## ARCH-14: Assistant Text Survives Tool Continuation

**Validates:** [agent-loop-spec.md](../architecture/agent-loop-spec.md) §Checking an implementation, [gateway-agent-loop-contract.md](../architecture/gateway-agent-loop-contract.md) §The request

**Setup:** A controlled model response that emits assistant text and a tool call in the same turn, followed by a second model response after the tool result.

**Procedure:**
1. Send a message that triggers the controlled response.
2. Capture the streamed text and tool events, the message sent on continuation, and the saved conversation.
3. Resume the conversation and inspect the history selected for the next turn.

**Pass criteria:**
- [ ] The assistant text appears in the stream before the tool continuation finishes.
- [ ] The next model call retains that text with the associated tool call and result in the shared message shape.
- [ ] Saved history retains the assistant text, call and result; any selected complete turn keeps their relationship on resume.

**Failure indicators:** Text vanishes when a tool call appears, a continuation fabricates a text-only assistant message, or resume loses the call/result relationship.

---

## ARCH-15: Conversations Survive Gateway Restart

**Validates:** [gateway-spec.md](../architecture/gateway-spec.md) §Conversation management, [memory-spec.md](../architecture/memory-spec.md) §Export and §Operations

**Setup:** A running Gateway with durable Memory and a conversation that includes assistant text, a tool call and its result.

**Procedure:**
1. Read the conversation through the Gateway API and record its ID and full content parts.
2. Stop and restart only the Gateway; keep the same Memory.
3. List and retrieve the conversation, then resume it with a new owner message.

**Pass criteria:**
- [ ] The conversation remains in the list under the same ID after restart.
- [ ] Detail and resume preserve all saved content parts, including the tool call and result.
- [ ] The next turn is appended to the same durable conversation through the Memory boundary.

**Failure indicators:** The conversation exists only in Gateway process state, disappears after restart, or resumes with text while dropping tool activity.

---

## ARCH-16: Tool Isolation Follows Owner Trust

**Validates:** [tools-spec.md](../architecture/tools-spec.md) §Where tools run, [security-spec.md](../architecture/security-spec.md) §Tool Isolation

**Setup:** Install a tool the owner has not marked trusted. Give it a narrow filesystem and network scope, and arrange an attempted access outside that scope.

**Procedure:**
1. Make the tool available to an actor who is allowed by Auth to call it.
2. Invoke it and attempt the out-of-scope access.
3. Cause the isolated tool process to fail; observe the Agent Loop and other tools.
4. Inspect the trust level visible to the owner and any explicit owner override.

**Pass criteria:**
- [ ] Auth permission alone does not remove the tool's isolation boundary.
- [ ] Out-of-scope access is denied; the tool cannot read the owner's unrelated data or another tool's data.
- [ ] The isolated tool's failure is reported and does not bring down the Agent Loop or unrelated tools.
- [ ] The owner can see and change the tool's trust posture on their own hardware.

**Failure indicators:** An untrusted tool runs with unrestricted filesystem or network access by default, or a tool crash terminates the Agent Loop.

---

## ARCH-17: Approval Decision Is Authorized And Replay Safe

**Validates:** [auth-spec.md](../architecture/auth-spec.md) §Permissions, [security-spec.md](../architecture/security-spec.md) §Approval lifecycle, [approval-decision.json](../contracts/schemas/approval-decision.json)

**Setup:** In a product that enables approvals, configure an Auth rule requiring approval for one tool call. Record the tool's actual execution count.

**Procedure:**
1. Request the tool call and capture the pending request ID and expiry.
2. From a second conforming client, submit a decision at `POST /approvals/{request_id}/decision`. Try an unauthenticated request, an identity lacking authority and a payload supplying its own decision-maker identity.
3. Submit an authorized approval, repeat it, then send a conflicting decision. Verify the returned record identifies the Auth-verified decision maker.
4. Repeat with authorized denial and cancellation. Attempt to approve a cancelled or expired request. Remove Auth availability and confirm the operation cannot apply a decision.

**Pass criteria:**
- [ ] The tool does not run while approval is pending or after an unauthorized decision.
- [ ] One authorized approval resolves the request and runs the tool at most once.
- [ ] Replaying the same terminal decision returns the same outcome; a conflicting decision is rejected.
- [ ] Cancellation and expiry are terminal and never execute the tool.
- [ ] The public Gateway operation is usable from both clients under the same Auth checks. Its response and the streamed result agree.

**Failure indicators:** A client presentation alone grants approval, replay runs the tool twice, or a terminal request can be approved later.

---

<a id="arch-18-imported-policy-does-not-revive-unknown-identity"></a>

## ARCH-18: Imported Grants Retain Identity And Scope

**Validates:** AC-3.3 and [Permissions after export/import](../architecture/auth-spec.md#permissions-after-exportimport).

**Setup:** Two implementations, one verifiable external-agent identity with a grant to a specific resource, one unrelated identity with the same display name or apparent ID, and one initially unsupported identity or policy condition. Use disposable identities and resources.

**Procedure:** Export and import Memory, its identity records and permission policies. Exercise the migrated identity on the original resource and on a different resource. Exercise both same-name and same-ID collision cases. Check the unsupported record, add support without changing the owner's grant, verify its original bindings, then remove the migrated identity.

**Pass criteria:**
- [ ] A verified identity can exercise the same verified grant once imported, without a new approval.
- [ ] A different identity with a matching name or ID receives no grant. A new or ambiguously mapped resource receives no access.
- [ ] Unsupported or unverified records are preserved, reported and inactive. On gaining support and verifying both bindings, only the original grant activates.
- [ ] Removing the identity removes its rules, and a fresh identity has no inherited access.

**Failure indicators:** An identity collision activates a grant, its resource scope broadens, or imports silently drop unsupported records.

---

## ARCH-19: Unsupported Model Ability Is Reported

**Validates:** [models-spec.md](../architecture/models-spec.md) §What the system guarantees about models, [gateway-agent-loop-contract.md](../architecture/gateway-agent-loop-contract.md) §Errors

**Setup:** Select a model that lacks a needed capability, such as image input, and prepare a request containing that kind of content.

**Procedure:**
1. Submit the request through the Gateway API.
2. Capture what the Gateway, Agent Loop and Model API adapter actually send and return.
3. Inspect the saved conversation and client-visible outcome.

**Pass criteria:**
- [ ] The limitation is reported to the owner; content is not silently omitted or converted into a false success.
- [ ] Model API, Agent Loop and Gateway API errors carry `capability_unsupported` and name the same missing `capability` (D197).
- [ ] No other model or provider is substituted without an explicit owner choice.
- [ ] The original request remains accurately represented in conversation history.

**Failure indicators:** An image part disappears, a tool call is falsely claimed, or a fallback model is used without the owner's choice.

---

<a id="arch-20-independent-tool-calls-overlap-without-losing-identity"></a>

## ARCH-20: Every Requested Tool Call Retains Its Identity

**Validates:** AC-8.4 and [Agent Loop concurrency](../architecture/agent-loop-spec.md#concurrency).

**Setup:** A controlled model requests two independent tools and a subsequent call that depends on one result. Give one call a denial or a controlled failure in a second run. Record call IDs, source IDs, results and timing.

**Procedure:** Run both turns and inspect scheduling, streamed events, saved history and model continuation.

**Pass criteria:**
- [ ] Every requested call runs or receives an explicit reason it did not run.
- [ ] A dependent call starts only after its prerequisite is available.
- [ ] Successful and failed results are associated with the right call and source. Assistant text survives the tool continuation.
- [ ] A write conflict is reported. Independent calls may run serially or concurrently.

**Failure indicators:** A call silently disappears, a dependent call races its input, or results are attached to the wrong call.

---

## ARCH-21: Same-Named Tools Retain Source Identity

**Validates:** [tools-spec.md](../architecture/tools-spec.md) §How tools are found and §What the model sees, [tool-definition.json](../contracts/schemas/tool-definition.json), [message.json](../contracts/schemas/message.json)

**Setup:** Register two tools named `search` from distinct sources with distinct results, both available to the actor.

**Procedure:** Discover both tools, call each through the Agent Loop, then inspect the emitted events, saved messages and model continuation.

**Pass criteria:**
- [ ] Both tools are discoverable without one overwriting the other.
- [ ] Each call carries the intended `source_id` and reaches only the matching tool.
- [ ] Results retain the correct call and source association in the stream and saved history.

**Failure indicators:** Name-only dispatch chooses the wrong tool, one definition disappears, or the source identity is lost on replay.

---

## ARCH-22: Additive Extensions Do Not Break Older Receivers

**Validates:** [communication-principles.md](../architecture/communication-principles.md) P6, [message.json](../contracts/schemas/message.json), [tool-definition.json](../contracts/schemas/tool-definition.json), [auth-context.json](../contracts/schemas/auth-context.json)

**Setup:** Use two adjacent component versions. The newer sender adds an unknown key under `extensions` on a text part, tool-call part, and tool definition. Prepare an `auth_context` with an unexpected field as a negative control.

**Procedure:** Send the extended message and tool definition through the older receiver. Repeat with the unexpected `auth_context` field and with an unknown core field outside `extensions` on a strict part.

**Pass criteria:**
- [ ] The older receiver accepts the schema-defined extension maps, ignores their unknown keys, and still processes the known message/tool fields correctly.
- [ ] Extension data cannot change tool identity, visibility, or Auth's decision.
- [ ] The malformed `auth_context` is rejected, and an unknown core field on a strict part is rejected rather than treated as an extension.

**Failure indicators:** An unknown extension key breaks an older receiver, changes core behavior, or grants access; an unexpected identity field is accepted.

---

## ARCH-23: Outside Connections Cross Owned Adapters

**Validates:** [Principle 2](../architecture/principles.md#2-keep-everything-else-swappable), [adapter-spec.md](../architecture/adapter-spec.md), D201, [lock-in gate](lockin-gate.md)

**Setup:** Inventory the implementation's active model providers, accepted client formats other than the canonical Gateway API, and connected external tool sources. A category with no active outside connection is marked not applicable with evidence; an unused adapter by itself does not prove that an external tool is usable.

**Procedure:** For each active outside connection, trace a request and reply or tool result through its adapter. Inspect the Agent Loop, Gateway and Auth source and imports for direct calls or parsing tied to that outside protocol. For a pass-through adapter, verify the same trace still crosses the owned boundary.

**Pass criteria:**
- [ ] Every active outside connection crosses an adapter owned by the system; the adapter can be a pass-through.
- [ ] Outside protocol details stay in the adapter, while core components receive canonical requests, events, tool definitions and results.
- [ ] Owner-controlled boundaries on both sides and native Gateway API clients are correctly identified, rather than given unnecessary adapters.

**Failure indicators:** Agent Loop, Gateway or Auth directly calls or parses a provider protocol, foreign client format or external tool protocol; a claimed adapter is bypassed on the active path.

---

## ARCH-24: Client Parity And Owner Data Continuity

**Validates:** AC-6.1 through AC-6.5.

**Setup:** A product client and a second client with equivalent Auth grants. Prepare a conversation with saved tool results, preferences, and a controlled storage failure.

**Procedure:** Inventory the product client's operations and exercise them through the public Gateway with the second client. Replace the first client and its cache. Resume the conversation with the second client. Exercise a missing conversation, a failed write and an unavailable Agent Loop.

**Pass criteria:**
- [ ] Both clients get the same operations under the same Auth checks. Approval decisions follow ARCH-17 where supported.
- [ ] The current message and metadata pass unchanged after structure validation. Selected history contains only complete turns within the configured limit.
- [ ] Saved conversations, context and preferences remain available with the first client and its cache removed.
- [ ] Each failure is reported truthfully, including any message that could not be saved.

**Failure indicators:** A private path grants privileged operations, a client holds the only copy of owner data, or a failed write is reported as saved.

---

## ARCH-25: Model Destination Disclosure And Provenance

**Validates:** AC-9.4 and AC-9.7.

**Setup:** Controlled on-device and off-device models. Include a product default and an owner-approved fallback where offered. Record the owner-facing disclosures and Model API calls in order.

**Procedure:** Use each configuration for a turn and induce a failure where an approved fallback can run. Inspect disclosures, call destinations and saved replies.

**Pass criteria:**
- [ ] Before a model receives owner data, the owner is told it sees what is sent and where it runs.
- [ ] The disclosure distinguishes this device from another machine, including one on the same network.
- [ ] Only configured destinations receive data and saved replies identify the actual model and provider.

**Failure indicators:** Data is sent before disclosure, off-device processing is described as on-device, or provenance records a model that did not produce the reply.

---

## ARCH-26: One Human Owner And Explicit Grants

**Validates:** AC-10.1, AC-10.3 and AC-10.7.

**Setup:** One initialized owner, a second human test identity, and a separate agent identity with no grants. Prepare a resource the owner can access.

**Procedure:** Verify owner sign-in and attempt to provision or use a second human login. Authenticate the external agent and exercise its access before and after an owner grant. Exercise delegation that exceeds the grantor's authority. Trace a conversation tool call to its authenticated actor.

**Pass criteria:**
- [ ] The owner is the only human identity accepted. An external agent has a distinct identity and starts without access.
- [ ] Non-owner access is traceable to an owner grant and stays within its scope. A grantor cannot delegate more access than it has.
- [ ] Configuration, discovery and untrusted metadata cannot widen authority. The owner's conversation uses the owner's actor identity.

**Failure indicators:** Another human signs in directly, a new identity receives implicit permissions, or a grant is widened by delegation or data.

---

## ARCH-27: Local Login Recovery Preserves Vault Controls

**Validates:** AC-10.10.

**Setup:** Use a disposable owner-controlled installation with a known protected test credential. Prepare one case with owner-controlled vault access and one where the existing vault requires unavailable unlock material.

**Procedure:** Use the documented local recovery procedure after losing the sign-in credential. Verify sign-in and the state of saved data and sessions. Attempt recovery from outside the owner-authorized local path. Exercise vault access under the same conditions as before the reset.

**Pass criteria:**
- [ ] The owner can regain local sign-in without an outside service. An unauthorized caller cannot use the recovery path.
- [ ] The reset does not bypass vault controls. An existing protected owner key or configured recovery method can still unlock the vault. A reset alone cannot unlock a closed vault without that access.
- [ ] Existing protected credential records are retained and invalidated sessions cannot authorize requests.

**Failure indicators:** Recovery requires an outside service, changes or bypasses the vault's protection, discards saved credentials, or is available to an unauthorized caller.

---

## ARCH-28: Auth Outage Fails Closed

**Validates:** AC-10.11.

**Setup:** A running target with an authenticated session, a tool with a harmless observable effect and a way to make Auth unavailable.

**Procedure:** Prove authorized access first. Disable Auth and issue a request with the existing session. In an active turn, make Auth unavailable before the next tool authorization. Observe the client result, tool effect and any returned owner data.

**Pass criteria:**
- [ ] Unchecked requests are denied even with a previously valid session.
- [ ] No unchecked tool executes or returns owner data. The owner receives a clear error.

**Failure indicators:** Prior authentication bypasses an unavailable authorization check or the target reports successful access.

---

## ARCH-29: Credentials Stay Within Their Binding

**Validates:** AC-3.5, AC-10.5 and AC-10.12.

**Setup:** Use synthetic credentials and controlled destinations, including a credential valid for the new destination and one with issuer restrictions that exclude it.

**Procedure:** Exercise the authorized connection, redirect, provider switch and edited endpoint. Approve a new binding explicitly, then repeat with the issuer-restricted credential. Move Memory to a second target and exercise the original binding after the owner's unlock. Inspect model inputs, tool-readable content, logs and the export without using production secrets.

**Pass criteria:**
- [ ] A credential is sent only to the verified service and destination for the authorized purpose. Mismatches are reported and the credential is withheld.
- [ ] Owner approval permits a new binding only within applicable issuer restrictions. A different credential is needed where the old one is invalid.
- [ ] Migration preserves the binding. Protected export requires owner-controlled unlock material, and ordinary model or tool access never reveals secret values.

**Failure indicators:** A redirect or edit silently forwards a credential, consent overrides issuer restrictions, or a migration widens access.

---

## ARCH-30: Tool Scope And Catalog Ownership

**Validates:** AC-8.2, AC-8.3, AC-8.6 and AC-8.7.

**Setup:** A configured source with a tool limited to a disposable resource scope, an unconfigured source and two resources, one inside and one outside that scope. Allow both resources in the test Auth policy.

**Procedure:** Discover and exercise the configured tool with both resources. Compare the responses for a denied tool and an unknown tool. Attempt discovery from an unconfigured source and verify source provenance and the owner's always-send selection.

**Pass criteria:**
- [ ] The tool succeeds inside scope and rejects access outside scope despite the broad Auth grant. The tool or its isolation boundary enforces the limit.
- [ ] Unknown and forbidden calls produce distinguishable outcomes.
- [ ] Only owner-configured sources contribute to the catalog. Source identity cannot be reassigned by a tool definition or metadata, and tools cannot add themselves to the always-send set.

**Failure indicators:** Auth is the only scope guard, an unconfigured source enters the catalog, or a source can impersonate another.

---

## ARCH-31: Data And Metadata Do Not Grant Authority

**Validates:** AC-7.2, AC-10.6 and AC-10.7.

**Setup:** A controlled model adapter, tool, authenticated identity and synthetic Memory and tool-result data. Give the test identity limited permissions.

**Procedure:** Send a turn containing ordinary Memory data, owner instructions, saved conversation history and a tool result. Capture the PAA-facing Model API request. Review authorization and identity propagation with invalid identity or untrusted metadata and extension fields.

**Pass criteria:**
- [ ] The model contract distinguishes data from owner-authorized instructions.
- [ ] Identity and trace information travel intact. The runtime rejects invalid or caller-supplied identity assertions.
- [ ] Neither content nor metadata changes identity, role or permission. The software enforces decisions independently of model output.

**Failure indicators:** Ordinary data is promoted into a privileged instruction channel or untrusted fields influence the effective identity or authorization.

---

## ARCH-32: Adapter Changes And Contained Departures

**Validates:** AC-7.5, AC-7.6 and AC-18.5.

**Setup:** A target with a documented external boundary, an alternate wire format, and a register of any temporary implementation exceptions with their rationale.

**Procedure:** Replace the boundary translation and exercise the same operation. Trace each recorded exception through the component that owns it and check its public boundary contract. Record the affected components and adapters.

**Pass criteria:**
- [ ] Boundary translation changes without requiring changes to the components on either side. An owner-controlled internal boundary may use an agreed internal format.
- [ ] Every claimed exception is documented, removable and contained inside one component with its boundary contract intact.

**Failure indicators:** A protocol change leaks into core code or another component must rely on an exception.

---

## ARCH-33: Repository Discovery And Build

**Scope:** Repository and published templates.

**Validates:** US-12 and AC-17.5.

**Setup:** A clean checkout and one published language template. Give a newcomer or new agent only the README and a fixed questionnaire covering the architecture's goal, four components, two APIs, swappability and how to start or verify a build.

**Procedure:** Time the orientation exercise. Follow the README routes to the authoritative rules, schemas and checks for each component. Ask an agent to build one bounded capability using only those materials. Independently start the template offline with a stand-in model, stream and save a reply, then change the provider through configuration and run the template checks.

**Pass criteria:**
- [ ] A newcomer answers the questionnaire in about ten minutes and can choose a build route. The relevant authority is reachable in a few steps and links resolve.
- [ ] Guides preserve the contract's rules. The bounded build, offline start, stream, save and config-only swap have recorded proof.
- [ ] The template supplies contract, boundary and lock-in checks. The build needs no PAA runtime package or language-specific architecture rule.

**Failure indicators:** An undocumented dependency blocks the bounded build, a guide overrides a rule, or missing proof is reported as a pass.

---

## ARCH-34: Repository Contract And Example Authority

**Scope:** Repository and published templates.

**Validates:** US-13.

**Setup:** A clean checkout with contract and example checker dependencies.

**Procedure:** Trace each component and API from the documentation to its canonical machine-readable contract and check. Run `scripts/check-contracts.py` and `contracts/examples/validate-manifest.py`. Review reported differences between guides or templates and the canonical shapes.

**Pass criteria:**
- [ ] Every published component and API has one authoritative definition and a verification route.
- [ ] Published examples match their valid or invalid labels.
- [ ] Any mismatch is recorded against the contract. Example or template behavior does not redefine it.

**Failure indicators:** Competing definitions, untraceable shapes, or examples that disagree with their validity label.

---

## ARCH-35: Repository Review And Conformance Reporting

**Scope:** Repository and published templates.

**Validates:** US-16 and AC-18.1 through AC-18.3.

**Setup:** A repository change and a sample conformance report with a pass, a failure and a criterion without runtime evidence.

**Procedure:** Follow the contribution and lock-in checks. Trace each changed rule to its reviewed spec, affected contracts and templates, and conformance check. Check that published test IDs are unique and stable. Walk both the pull request gate and release audit.

**Pass criteria:**
- [ ] Contributions route to review. A spec change has compatible contracts, checks and affected templates, and each added or materially changed criterion maps to a check.
- [ ] Tests have stable unique IDs, setup and outcomes. Reports show what passed, failed or remains without proof criterion by criterion.
- [ ] Code differences are fixed, reviewed as proposed spec changes, or explicitly recorded with their reason.

**Failure indicators:** A change bypasses review, drifts without a record or proof, or a missing test result becomes a pass.
