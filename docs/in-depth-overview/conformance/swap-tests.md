# Swap Tests

> Validates D147: three normal swaps must succeed with config-only changes — zero code edits.

---

## SWAP-1: Provider Swap

**Validates:** Model API contract, Principle 2 (everything else is swappable)

**Setup:**
1. System running with Provider A (e.g., OpenRouter adapter)
2. Standard test conversation completing successfully (message → model → tool call → response)

**Procedure:**
1. Stop the system
2. Change `provider_adapter` in runtime config to Provider B (e.g., Ollama adapter)
3. Provide the new adapter config file
4. Set the API key / connection environment variable
5. Start the system
6. Run the same test conversation

**Pass criteria:**
- [ ] Test conversation completes successfully with Provider B
- [ ] Zero code changes were required between steps 1 and 6
- [ ] Only config file changes and environment variable changes were made
- [ ] Gateway, Auth, Your Memory, tools, and clients are completely unmodified

**Failure indicators:**
- Any source code file was modified
- Any component other than the Agent Loop's adapter needed changes
- The system required a rebuild or recompilation

---

## SWAP-2: Model Swap

**Validates:** Model API contract, model independence

**Setup:**
1. System running with Model A (e.g., Claude Sonnet via OpenRouter)
2. Standard test conversation completing successfully

**Procedure:**
1. Change the model preference in Your Memory preferences file (or adapter config model list)
2. Send a new message (no restart required)

**Pass criteria:**
- [ ] Next message is processed by Model B
- [ ] Zero code changes were required
- [ ] Only a preference or config value was changed
- [ ] Response format is identical from the Gateway's perspective (same SSE events)

**Failure indicators:**
- The Agent Loop required modification to support the new model
- The Gateway needed to know which model was in use
- Tool definitions needed modification for the new model

---

## SWAP-3: Tool Swap

**Validates:** D51 (tools are data in the environment), Principle 3 (interfaces over implementations)

### SWAP-3a: Add a Tool

**Setup:**
1. System running with base tool set
2. New tool available (MCP server, CLI wrapper, or native function)

**Procedure:**
1. Install the tool in a `tool_sources` path
2. Restart the Agent Loop (or trigger hot-reload if supported)
3. Send a message that would benefit from the new tool

**Pass criteria:**
- [ ] Agent Loop discovers the new tool at startup via self-description
- [ ] Model can see and use the new tool
- [ ] Zero code changes to Agent Loop, Gateway, Auth, or Your Memory
- [ ] Only environment changes (tool installed) and optionally preferences updated (always-send set)

### SWAP-3b: Remove a Tool

**Setup:**
1. System running with a tool that will be removed

**Procedure:**
1. Remove the tool from its `tool_sources` path
2. Remove from always-send preferences if applicable
3. Restart the Agent Loop

**Pass criteria:**
- [ ] System functions normally without the removed tool
- [ ] Model no longer sees the removed tool in its definitions
- [ ] Zero code changes to any component
- [ ] No errors — the system gracefully handles the tool's absence

**Failure indicators:**
- Agent Loop has hardcoded references to specific tools
- Removing a tool causes component failures beyond "tool not available"
- Code changes were required to add or remove the tool
