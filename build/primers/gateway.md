# Gateway

> The client-facing boundary that manages conversations and routes interactions to the Agent Loop.

## Purpose

Accept external requests, manage conversation lifecycle, call Auth on every request, and hand bounded interaction requests to the Agent Loop.

## Owns

- Client-facing request handling.
- Conversation lifecycle.
- Routing requests into the Agent Loop.
- Returning streamed results to clients.

## Does Not Own

- Model choice as an architectural responsibility (the owner chooses the model and provider profile; the Gateway only reads the current choices and passes them on).
- Tool execution.
- Memory storage internals.
- Auth policy internals.
- Product reasoning or semantic interpretation.

## Dependencies

- Auth, called on every request through the Auth contract.
- Conversation-store access path into Memory.
- Gateway -> Agent Loop internal contract.

## Interfaces

- Exposes the Gateway API to clients.
- Uses the internal `messages + model + provider + metadata` contract with the Agent Loop.
- Calls Auth on every request, before anything reaches the Agent Loop or conversation data.
- Uses dedicated conversation access to Memory.

## Required Behaviors

- Manage conversation load, create, append, and retrieval behavior.
- Access conversation data through a dedicated conversation-store boundary or tool rather than a private in-process store.
- Accept client messages plus client metadata. Message content is a list of parts.
- Save tool calls and tool results as ordinary parts of messages in conversation history, and send them back on resume.
- Read the owner's current model and provider choice on every message and pass both to the Agent Loop, so a change applies to the next message with no restart.
- Store the model and provider profile that produced each assistant reply on the saved message (D194).
- Forward only bounded interaction data to the Agent Loop. The bootstrap prompt is Agent Loop configuration, not something the Gateway adds.
- Stream or proxy Agent Loop results back to clients.
- Permit only one active Agent Loop turn per conversation; queue later messages in arrival order while allowing different conversations to run concurrently.
- Persist the incoming message before dispatch when possible. Retain observed partial output and the terminal error as an incomplete turn; do not dispatch if initial persistence fails.
- Stay content-agnostic at the architectural level.

## Forbidden Behaviors

- Picking a model itself, or routing to models (passing the owner's current choice is required, choosing one is forbidden).
- Building a system message from configuration.
- Executing tools itself.
- Reaching directly into Memory storage internals.
- Embedding Auth as Gateway-owned logic instead of boundary use.
- Turning the internal Agent Loop handoff into a third public API.

## Lifecycle Rules

- Conversation state must live in the architecture-approved substrate, not transient process state.
- Internal request shaping must stay bounded and contract-aligned.
- Runtime exposure must follow deployment and TLS posture rules.

## Audit Questions

- Does Gateway still own conversation lifecycle?
- Is the Gateway passing the owner's current model and provider choice, rather than picking either or fixing it at startup?
- Is Gateway talking to Memory through the right boundary?
- Does the Gateway call Auth on every request, including list and history reads?
- Are tool calls and tool results saved in conversation history?
- Does Gateway send only contract-bounded data to Agent Loop?

## Common Drift Patterns

- Provider routing or model-selection logic living in Gateway (beyond reading the owner's current choice).
- Only user and assistant text stored, so tool calls are lost on resume.
- In-process or private conversation stores bypassing Memory rules.
- Content interpretation beyond transport normalization.
- Auth omitted or bypassed in runtime wiring.
- Approval, where a product adds it, handled as client-specific behavior instead of contract interaction.
- Concurrent active turns for the same conversation, or treating a partial failed stream as a successful completion.

## Review Links

- Checklist: `conformance/review-checklists/gateway-review.md`
- Traceability: `maintainers/traceability-map.md`
- Examples: `contracts/examples/README.md`

## Source Docs

- `architecture/gateway-spec.md`
- `architecture/gateway-agent-loop-contract.md`
- `architecture/overview.md`
- `architecture/auth-spec.md`
- `architecture/memory-spec.md`
- `architecture/deployment-spec.md`
