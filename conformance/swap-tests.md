# Swap Tests

> Validates D147: three normal swaps must succeed with config-only changes — zero code edits.

The Model API contract remains streaming-only (`stream: true`) with discriminated
completion events; adapter transport details may vary behind that boundary.

Approval-enabled implementations must retain the canonical pending/terminal approval
lifecycle and replay semantics while components are swapped; the architecture default
still requires no approval prompt.

Identity-enabled swaps must likewise preserve the canonical `auth_context` actor and
correlation data across the selected transport adapter.

If the actor is revoked during a running turn, the selected implementation must
also preserve the cancellation semantics: the Gateway targets the turn by
correlation ID, the Agent Loop stops without starting further tool work, and the
result is recorded using the portable audit record.

Tool swaps must preserve `source.id` + name identity and the canonical visibility
markers while adapter configuration changes remain outside tool definitions.

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

A restart is allowed here: the provider adapter is startup configuration. Changing only the model never needs a restart (see SWAP-2), and neither does switching to another provider profile in the loaded adapter (SWAP-1b, D193).

An unresolved provider failure is reported by the Agent Loop as `provider_error`.
The Agent Loop may make one recorded retry on the same selected model and
provider profile. This test never permits a silent switch to another model or
provider; an explicit retry or provider change after the failed turn is a
separate owner/product action (D188).

**Pass criteria:**
- [ ] Test conversation completes successfully with Provider B
- [ ] Zero code changes were required between steps 1 and 6
- [ ] Only config file changes and environment variable changes were made
- [ ] Gateway, Auth, Your Memory, tools, and clients are completely unmodified

**Failure indicators:**
- Any source code file was modified
- Any component other than the Agent Loop's adapter needed changes
- The system required a rebuild or recompilation

### SWAP-1b: Provider Profile Switch

**Setup:** The loaded adapter config lists two provider profiles (e.g., OpenRouter and a local Ollama endpoint), with the first active.

**Procedure:**
1. Send a test message and note the provider recorded on the reply
2. Change the active provider preference in Your Memory to the second profile, without restarting
3. Send the same test message

**Pass criteria:**
- [ ] The second message uses the second provider with no restart and no code change
- [ ] Each saved reply records the model and provider that produced it (D194)

---

## SWAP-2: Model Swap

**Validates:** Model API contract, model independence

**Setup:**
1. System running with Model A (e.g., Claude Sonnet via OpenRouter)
2. Standard test conversation completing successfully

**Procedure:**
1. While the system keeps running, change the model preference in Your Memory
2. Send a new message

**Pass criteria:**
- [ ] Next message is processed by Model B
- [ ] No component was stopped, restarted or reloaded between the change and that message
- [ ] Zero code changes were required
- [ ] Only a preference or config value was changed
- [ ] Response format is identical from the Gateway's perspective (same SSE events)
- [ ] The next request uses Model B's verified context limit; full saved history remains readable even if its working context is shorter

**Failure indicators:**
- The Agent Loop required modification to support the new model
- A restart was needed before Model B was used
- A later message, not the next one, was the first to use Model B
- Tool definitions needed modification for the new model

---

## SWAP-3: Tool Swap

**Validates:** D51 (tools are data in the environment), Principle 2 (Keep Everything Else Swappable)

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
