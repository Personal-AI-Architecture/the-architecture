# Gateway

> The client-facing boundary that manages conversations and routes interactions to the Agent Loop.

## Purpose

Accept external requests, manage conversation lifecycle, run Auth on the path, and hand bounded interaction requests to the Agent Loop.

## Owns

- Client-facing request handling.
- Conversation lifecycle.
- Routing requests into the Agent Loop.
- Returning streamed results to clients.

## Does Not Own

- Model choice as an architectural responsibility.
- Tool execution.
- Memory storage internals.
- Auth policy internals.
- Product reasoning or semantic interpretation.

## Dependencies

- Auth boundary for request authorization.
- Conversation-store access path into Memory.
- Gateway -> Agent Loop internal contract.

## Interfaces

- Exposes the Gateway API to clients.
- Uses the internal `messages + metadata` contract with the Agent Loop.
- Uses Auth on the request path.
- Uses dedicated conversation access to Memory.

## Required Behaviors

- Manage conversation load, create, append, and retrieval behavior.
- Access conversation data through a dedicated conversation-store boundary or tool rather than a private in-process store.
- Accept client messages plus client metadata.
- Forward only bounded interaction data to the Agent Loop.
- Stream or proxy Agent Loop results back to clients.
- Stay content-agnostic at the architectural level.

## Forbidden Behaviors

- Choosing or reconfiguring models in the interaction path.
- Executing tools itself.
- Reaching directly into Memory storage internals.
- Embedding Auth as Gateway-owned logic instead of boundary use.
- Turning the internal Engine handoff into a third public API.

## Lifecycle Rules

- Conversation state must live in the architecture-approved substrate, not transient process state.
- Internal request shaping must stay bounded and contract-aligned.
- Runtime exposure must follow deployment and TLS posture rules.

## Audit Questions

- Does Gateway still own conversation lifecycle?
- Is model/provider choice leaking into Gateway?
- Is Gateway talking to Memory through the right boundary?
- Is Auth on the real request path?
- Does Gateway send only contract-bounded data to Engine?

## Common Drift Patterns

- Provider/model preference logic living in Gateway.
- In-process or private conversation stores bypassing Memory rules.
- Content interpretation beyond transport normalization.
- Auth omitted or bypassed in runtime wiring.
- Approval handled as client-specific behavior instead of contract interaction.

## Review Links

- Checklist: `docs/ai/review-checklists/gateway-review.md`
- Traceability: `docs/ai/traceability-map.md`
- Examples: `docs/ai/examples/README.md`

## Source Docs

- `docs/gateway-spec.md`
- `docs/gateway-engine-contract.md`
- `docs/foundation-spec.md`
- `docs/auth-spec.md`
- `docs/memory-spec.md`
- `docs/deployment-spec.md`
