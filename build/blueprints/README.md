# Blueprint Packages

Each package is a self-contained implementation handoff for one PAA boundary.
The authoritative contract remains in [`contracts/`](../../contracts/); these
files are derived build guidance.

Every package contains:

- `blueprint.md` — what to build and why
- `contract-pack.json` — a generated manifest of the canonical sources used by the package
- `tests.md` — positive and negative conformance vectors
- `drift-guard.md` — architecture drift checks
- `prompt.md` — implementation handoff for an AI coding agent

| Package | Boundary |
|---|---|
| [Gateway](gateway/) | Conversation management and routing |
| [Gateway API](gateway-api/) | Client-facing API boundary |
| [Agent Loop](agent-loop/) | Model/tool execution loop |
| [Auth](auth/) | Identity and authorization |
| [Memory](memory/) | Owner-controlled persistence |
| [Memory Tools](memory-tools/) | Memory capability surface |
| [Model API](model-api/) | Agent Loop to Models boundary |
| [Models](models/) | External model dependency boundary |
| [Gateway-Agent Loop Contract](gateway-agent-loop-contract/) | Internal Gateway/Agent Loop boundary |
| [Security](security/) | Security boundary |
| [Deployment](deployment/) | Deployment posture |
| [Adapter](adapter/) | External protocol translation |
| [Configuration](configuration/) | Runtime configuration |
| [Tools](tools/) | Tool capability surface |

Templates for creating or reviewing packages are in [`templates/`](templates/).
