# Foundation User Story Tests

> Validates the end-to-end promises of the architecture (FS-1 through FS-8 from [foundation-spec.md](../../foundation-spec.md)).
> Some tests overlap with SWAP/ARCH/DEPLOY tests — noted with `=` references.

---

## FS-1: Move Your Memory

**Validates:** Principle 1 (Memory is the platform), memory portability, zero outward dependencies

**Setup:**
1. System A running with populated Your Memory:
   - Documents, skills, configuration preferences
   - Conversation history
   - Version history (git)
   - Custom preferences (always-send tools, model choice, approval settings)
2. System B — a fresh deployment on different hardware (or different deployment mode)

**Procedure:**
1. Export Your Memory from System A (full export)
2. Set up System B with its own runtime config (different `memory_root`, potentially different adapter)
3. Import the exported Memory into System B's `memory_root`
4. Start System B
5. Verify Memory contents and system behavior

**Pass criteria:**
- [ ] All documents, skills, and files are present and intact
- [ ] Conversation history is accessible and resumable
- [ ] Version history is preserved
- [ ] Preferences are read and honored where the new environment supports them
- [ ] Preferences referencing unavailable tools/models are reported as gaps (not errors)
- [ ] The system tells the user about any gaps: "Web scraper is preferred but not available"
- [ ] Nothing was lost in the transfer — complete export/import roundtrip

**Failure indicators:**
- Files are in a format that only System A can read
- Preferences reference environment-specific paths or services
- Conversation history is tied to a specific Gateway implementation
- Export is incomplete (missing conversations, settings, or history)

---

## FS-2: Add Capability Without Violating the Architecture

**Validates:** Principle 3 (interfaces over implementations), Principle 1 (Memory has zero outward dependencies), D64

**Setup:**
1. System running with base configuration
2. New capability to add: a tool, a skill, a client, or a model provider

**Procedure (for each capability type):**

**Add a tool:**
1. Install a new MCP server or CLI tool in a `tool_sources` path
2. Restart Engine (or hot-reload)
3. Verify the tool is discoverable and usable

**Add a skill:**
1. Create a new skill markdown file in Your Memory
2. No restart needed — model reads it through tools
3. Verify the skill is executable

**Add a client:**
1. Build a new client that speaks the Gateway API
2. Connect it to the Gateway
3. Verify it works identically to existing clients

**Add a model provider:**
1. Create a new adapter config file
2. Change `provider_adapter` in runtime config
3. Restart and verify

**Pass criteria (all capability types):**
- [ ] Your Memory gains no outward dependencies from the addition
- [ ] No component bypasses the APIs (Gateway API, Provider API)
- [ ] The four-component structure holds — no new components were needed
- [ ] Zero code changes to existing components
- [ ] The addition is purely data/configuration entering the system

**Failure indicators:**
- Adding a tool required modifying the Engine
- Adding a skill required code changes
- Adding a client required Gateway modifications
- Adding a provider required Engine changes beyond the adapter
- Your Memory now depends on a specific tool or service being present

---

## FS-3: Run on Own Hardware

**Validates:** Deployment contract, Pillar 2 (Ownership), Pillar 3 (Freedom)

**Equivalent to:** DEPLOY-1 (Offline operation) + DEPLOY-2 (Local data storage) + DEPLOY-3 (Default localhost)

**Pass criteria:**
- [ ] System installs on laptop/desktop/server without external service accounts
- [ ] System functions fully offline with local model
- [ ] All data stays on the owner's machine
- [ ] Owner has full control — can inspect, modify, export everything
- [ ] No license server, activation service, or external validation required

---

## FS-4: Swap Provider

**Equivalent to:** SWAP-1

**Pass criteria:**
- [ ] Change provider config → next message uses new provider → no code changes

---

## FS-5: Swap Client

**Equivalent to:** ARCH-3

**Pass criteria:**
- [ ] New client speaks Gateway API → system serves it identically

---

## FS-6: Evolve Memory

**Validates:** Principle 1, Memory independence

**Setup:**
1. System running with file-based search only
2. Semantic search tool available (vector index + search tool)

**Procedure:**
1. Install the semantic search tool (MCP server or native function)
2. Index existing Your Memory content into a vector store
3. Add the semantic search tool to the always-send set (preference in Your Memory)
4. Restart Engine
5. Use semantic search in a conversation

**Pass criteria:**
- [ ] Semantic search works alongside existing file search
- [ ] No other component changed — Engine, Gateway, Auth, clients are unmodified
- [ ] Existing file search still works identically
- [ ] The vector index is derived data — deleting it doesn't lose source content
- [ ] Adding the search capability was purely additive

**Failure indicators:**
- Engine needed modification to support semantic search
- Gateway needed to know about the new search capability
- Existing search broke when the new search was added
- The vector index became a dependency (system fails without it)

---

## FS-7: Swap Engine

**Equivalent to:** ARCH-2

**Pass criteria:**
- [ ] Replace Engine implementation → Gateway/Memory/Auth/tools unaffected → system functions

---

## FS-8: Expand Scope via Tools

**Validates:** D55 (scope = available tools + permissions), Principle 5 (start constrained, expand deliberately)

**Setup:**
1. System running with library-scoped tools only (V1 scope — reads/writes within library folder)

**Procedure:**
1. Add filesystem tools that operate beyond the library folder (V2 scope expansion)
2. Update Auth permissions to allow the new scope
3. Verify the system can now operate on the broader filesystem

**Pass criteria:**
- [ ] Scope expanded from library to filesystem by adding tools — no architectural changes
- [ ] Engine didn't change — it uses whatever tools are available
- [ ] Gateway didn't change — it routes the same way
- [ ] Auth controls which expanded tools each actor can use
- [ ] Memory tools (library-scoped) continue to work identically
- [ ] The expansion is reversible — remove the tools and scope contracts back

**Failure indicators:**
- Scope expansion required Engine modification
- A "scope manager" or "boundary enforcer" component was needed
- Expanding scope required Gateway or client changes
- The expansion couldn't be reversed by removing tools
