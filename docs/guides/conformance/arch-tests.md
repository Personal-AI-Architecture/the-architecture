# Architectural Invariant Tests

> Validates component boundaries, independence, and structural properties of the architecture.

---

## ARCH-1: Memory Zero Dependencies

**Validates:** Principle 1 (Memory is the platform), foundation-spec §Your Memory

**Setup:**
1. System running with data in Your Memory (files, conversations, preferences)
2. All components operational

**Procedure:**
1. Stop the Engine process
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

## ARCH-2: Engine Swap

**Validates:** D39 (Engine is generic), FS-7 (Swap the Engine)

**Setup:**
1. System running with Engine Implementation A
2. Test conversation completing successfully
3. Engine Implementation B available (different codebase, same contract)

**Procedure:**
1. Stop the system
2. Replace Engine A binary/container with Engine B
3. Keep all other components, config, Your Memory, tools unchanged
4. Start the system
5. Run the same test conversation

**Pass criteria:**
- [ ] Test conversation completes successfully with Engine B
- [ ] Gateway operates identically — same conversation management
- [ ] Auth operates identically — same authentication/authorization
- [ ] Your Memory is unchanged — same files, same data
- [ ] Tools work identically — same tool calls succeed
- [ ] Clients connect identically — same Gateway API
- [ ] Only the Engine binary/container was changed

**Failure indicators:**
- Gateway needed modification to work with Engine B
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
- [ ] Zero changes to Gateway, Engine, Auth, Your Memory, or tools

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
2. Capture all Provider API requests and responses
3. Capture all Gateway ↔ Engine requests and SSE events
4. Validate each payload against the corresponding canonical schema

**Pass criteria:**
- [ ] Every Gateway API request validates against `gateway-api.yaml`
- [ ] Every Gateway API response validates against `gateway-api.yaml`
- [ ] Every Engine request validates against `gateway-engine.yaml`
- [ ] Every SSE event validates against the event schemas in `gateway-engine.yaml`
- [ ] Every Provider API request validates against `provider-api.yaml`
- [ ] Every Provider API response validates against `provider-api.yaml`
- [ ] No payload contains fields not defined in the schemas (no undocumented extensions)

**Failure indicators:**
- Custom fields added outside the schema
- Provider-specific data leaking through the internal contract
- Client-specific formats in the Gateway API
- Missing required fields defined in the schemas
