# Architectural Invariant Tests

> Validates component boundaries, independence, and structural properties of the architecture.

---

## ARCH-1: Memory Zero Dependencies

**Validates:** Principle 1 (Memory is the platform), foundation-spec §Your Memory

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
- [ ] All files in Your Memory are readable with a text editor
- [ ] SQLite databases are readable with a standard SQLite viewer
- [ ] Git history is browsable with standard git commands
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

**Validates:** D16 (zero custom protocols), canonical contract definitions

**Setup:**
1. System running with active traffic (messages, tool calls, responses)
2. Canonical schemas available in `../../../specs/openapi/` and `../../../specs/schemas/`

**Procedure:**
1. Capture all Gateway API requests and responses
2. Capture all Model API requests and responses
3. Capture all Gateway ↔ Agent Loop requests and SSE events
4. Validate each payload against the corresponding canonical schema

**Pass criteria:**
- [ ] Every Gateway API request validates against `gateway-api.yaml`
- [ ] Every Gateway API response validates against `gateway-api.yaml`
- [ ] Every Agent Loop request validates against `gateway-engine.yaml`
- [ ] Every SSE event validates against the event schemas in `gateway-engine.yaml`
- [ ] Every Model API request validates against `model-api.yaml`
- [ ] Every Model API response validates against `model-api.yaml`
- [ ] No payload contains fields not defined in the schemas (no undocumented extensions)

**Failure indicators:**
- Custom fields added outside the schema
- Provider-specific data leaking through the internal contract
- Client-specific formats in the Gateway API
- Missing required fields defined in the schemas

---

## ARCH-5: Error Taxonomy Compliance

**Validates:** gateway-engine-contract.md §Mid-Stream Errors, engine-spec.md §Error output

**Setup:**
1. System running with active traffic
2. Ability to trigger provider failures, tool failures, and context overflow conditions

**Procedure:**
1. Trigger a model/network failure (e.g., invalid provider URL)
2. Trigger an unrecoverable tool execution failure (e.g., tool executor crash)
3. Trigger a context overflow (e.g., send messages exceeding model context window)
4. Capture the SSE error events emitted in each case

**Pass criteria:**
- [ ] Provider/network failure emits `provider_error`
- [ ] Unrecoverable tool failure emits `tool_error`
- [ ] Context overflow emits `context_overflow`
- [ ] No catch-all error code used for all failure types
- [ ] Recoverable tool failures (tool returns an error result) go back to the model as `tool-result` events, not as stream-fatal `error` events

**Failure indicators:**
- All errors emit the same code regardless of cause
- Tool execution errors that the model could recover from terminate the stream
- Context overflow is reported as `provider_error`

---

## ARCH-6: Error Message Sanitization

**Validates:** gateway-engine-contract.md §Security Requirements, security-spec.md

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

**Validates:** memory-spec.md §Export, security-spec.md §Owner Data Rights

**Setup:**
1. System running with data in Your Memory (files, conversations, preferences, version history)

**Procedure:**
1. Invoke the `memory_export` tool (or equivalent export mechanism)
2. Stop the system
3. Inspect the exported archive with standard tools

**Pass criteria:**
- [ ] Export produces a complete archive of all owned Memory data
- [ ] Archive is in an open format (tar, zip, or equivalent)
- [ ] Files are readable with a text editor
- [ ] Version history is included or reproducible
- [ ] Conversations are included in the export
- [ ] Auth credentials are NOT included in the export
- [ ] Archive is readable without the system running

**Failure indicators:**
- Export is missing files, conversations, or version history
- Export contains credentials or secrets
- Export format requires the system to decode

---

## ARCH-8: Auth Tool Surface

**Validates:** auth-spec.md §Minimal Tool Surface

**Setup:**
1. System running with Auth configured (any mode, including local owner)

**Procedure:**
1. Call `auth_whoami` tool
2. Call `auth_check` tool with a known resource/action
3. Call `auth_export` tool

**Pass criteria:**
- [ ] `auth_whoami` returns current actor identity (type, ID)
- [ ] `auth_check` returns a permission decision (allow/deny) for the given resource/action
- [ ] `auth_export` returns auth configuration without credentials
- [ ] All three tools are registered and discoverable alongside memory tools

**Failure indicators:**
- Any of the three tools is missing from the tool registry
- `auth_whoami` returns empty or error
- `auth_export` includes credentials or secrets

---

## ARCH-9: Version History Reliability

**Validates:** memory-spec.md §Guarantees, security-spec.md §Version History

**Setup:**
1. Fresh system install (no prior data)

**Procedure:**
1. Start the system for the first time
2. Write a file to Your Memory
3. Modify the file
4. Call `memory_history` on the file
5. Request a previous state using the returned version identifier

**Pass criteria:**
- [ ] System starts successfully on first run with version history initialized
- [ ] `memory_history` returns at least two change records (create + modify)
- [ ] Previous state is retrievable and matches the original file content
- [ ] If version history cannot be initialized at startup, the system fails with a clear error (not a warning)

**Failure indicators:**
- System starts but version history silently fails
- `memory_history` returns only metadata without access to previous states
- First-run initialization produces warnings instead of deterministic setup

---

## DEPLOY-5: Default Bind Address

**Validates:** Security-spec.md §Network Boundaries

**Setup:**
1. Fresh system install with default configuration

**Procedure:**
1. Start the system with no bind address configuration changes
2. Check the listening address of the Gateway HTTP server

**Pass criteria:**
- [ ] Gateway binds to `127.0.0.1` only by default
- [ ] Gateway does NOT bind to `0.0.0.0` unless explicitly configured
- [ ] Changing bind address to `0.0.0.0` requires an explicit configuration change (not just removing a restriction)

**Failure indicators:**
- Default install listens on all interfaces
- Docker configuration maps the port to the host by default
