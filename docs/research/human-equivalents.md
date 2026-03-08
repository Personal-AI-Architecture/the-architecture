---
hide_table_of_contents: true
---

# Human Equivalents — How the Architecture Maps to Human Experience

## Why This Document Exists

The architecture makes claims that sound abstract — "tools are not a component," "memory is the platform," "everything is swappable except memory." These claims become obvious when you map them to how humans already work. This document captures those mappings.

---

## The Three Levels

### Architecture: You — The System Itself

A person has a brain and a body. The brain holds memory, applies intelligence, and controls access (who gets to know what about you). The body executes — it does what the brain decides.

| Human | Architecture | Notes |
|-------|-------------|-------|
| **Brain** | Memory + Models (intelligence) + Auth | The brain remembers, reasons, and decides who to trust |
| **Body** | Agent Loop | Executes what the brain decides — the hands that do the work |
| **You (the whole person)** | The 4 components together | Brain + body = a functioning person. Memory + Agent Loop + Auth + Gateway = a functioning system |

**Where the analogy breaks — and that's an advantage.** In the human world, you can't swap your brain or upgrade your body. In the digital world, you can. Every component except Memory is swappable and upgradeable. Better intelligence? Swap the model. Better execution? Swap the Agent Loop. Better access control? Swap Auth. The one thing you can't swap is the one thing that makes you *you* — Your Memory. Your Memory is Your Memory.

This is the digital advantage: everything that's infrastructure can improve without losing what's personal.

### Implementation: Internal Tools — How the Brain and Body Work Together

In a human, remembering and recalling aren't "tools you use" — they're just how your brain works. You don't think of reaching for a memory as picking up a tool.

In the architecture, Memory access is mediated through tools (read, write, search) because of the zero-dependency principle — Memory can't depend on the Agent Loop. The Agent Loop accesses Memory through explicit interfaces. But functionally, these are internal operations, not tools you "hold." They're the nervous system — how the body accesses what the brain knows.

| Human | Architecture |
|-------|-------------|
| Remembering something | Memory read tool |
| Learning / storing a new fact | Memory write tool |
| Searching your memory for something relevant | Memory search tool |
| Your nervous system (connects brain to body) | The tool interface between the Agent Loop and Memory |

### Personalization: External Tools — What Your Hands Hold

This is where the real tool analogy kicks in. Humans make tools, use tools made by others, own some tools, pay to use others, and pay people to use tools on them.

| Human | Architecture |
|-------|-------------|
| Tools you own (your hammer, your screwdriver) | Tools in your environment — installed locally, you control them |
| Tools you pay to use (renting equipment, gym membership) | External tool services — third-party APIs, hosted MCP servers |
| Paying someone to use tools for you (hiring a contractor) | Agent Loop + Model — intelligence you pay for (Model API) that uses tools on your behalf |
| Your workshop / toolshed | The tool environment — what's installed and available |
| Buying a new tool | Installing a new tool in the environment |
| Learning a new skill (how to use a tool) | A skill file in Your Memory — instructions that reference tools |

**Ownership split:**
- **Tools I own** (in my environment) — my hammer, my screwdriver. I control them. I take them when I move.
- **Tools I don't own** (external to environment) — the ATM, the grocery store, the postal service. I use them, but they're someone else's infrastructure.

### The Hand Doesn't Care

The hand doesn't know or need to know if the tool you're using is yours or someone else's — it just needs to use it. Same with the Agent Loop. It grips and executes. It doesn't care about ownership, origin, or where the tool came from.

That's Auth's job — deciding *whether* you can use a tool. That's Memory's job — knowing *which* tools you prefer. The hand just executes. A tool is a tool.

---

## Moving Cities — The Portability Analogy

When you move to a new city:

| What you do | What it maps to |
|-------------|----------------|
| **Take your stuff** (car, clothes, furniture) | **Take Your Memory** — your data, your preferences, your skills, your history |
| **Leave the infrastructure** (roads, buildings, utilities) | **Leave the components** — the new system has its own Agent Loop, Gateway, Auth |
| **Find equivalent services** (new grocery store, new doctor, new bank) | **Find equivalent tools** — the ecosystem has the same MCP servers, CLI tools, APIs |
| **Reconfigure logistics** (new address, new routes, new accounts) | **Reconfigure plumbing** — server addresses, ports, API keys (environment config) |

You don't lose capability when you move because the new city has roads and stores too. What makes the new house *yours* is the stuff you brought — Your Memory.

Your skills also travel with you. You know how to drive, you know which stores you need, you know your routines. In the architecture, skills are markdown files in Your Memory — they tell the new system "I need a git tool and a filesystem tool and here's how I use them." The new system wires them up.

**The one real risk:** a tool that's not ecosystem-standard. If you depend on a proprietary tool that only exists in one system, that's lock-in through the tool layer. But that's the tool vendor's lock-in, not the architecture's — and the architecture is designed so you always have alternatives. You don't need a tool management department between you and your hammer — you just pick it up and use it.

---

## Internal Communication — Your Nervous System

Your body's internal signaling is remarkably consistent. Pain from your hand and pain from your foot travel the same neural pathways using the same signal structure. Your brain doesn't need a different protocol for each organ — it recognizes any internal signal without checking which body part sent it.

| Human | Architecture | Principle |
|-------|-------------|-----------|
| Same signal structure regardless of source | Consistent message envelope across all internal interfaces | P3 — Consistent Message Structure |
| You can tell *where* a signal came from (which nerve, which limb) | Correlation IDs trace a request through every component it touches | P4 — Observability |
| Pain has intensity, location, and type (sharp, dull, burning) | Errors are machine-readable with codes, retryability, and correlation context | P5 — Structured Errors |
| New neural connections form without breaking existing ones | New fields and metadata are additive — older components ignore what they don't understand | P6 — Extensibility |
| Your brain decides what to do about the signal, not the nerve | The model makes semantic decisions, infrastructure just routes | P2 — Model Decides |
| Your nervous system uses electrochemical signaling — it didn't invent its own physics | Internal communication uses industry standards (HTTP, JSON, SSE) — it doesn't invent custom protocols | P1 — Standards First |

**Where the analogy breaks — and that's fine.** A biological nervous system can't swap its signaling mechanism. This architecture can. The communication conventions are replaceable (P7) — strip them out and replace with direct HTTP calls, the system still works. You can't do that with your spinal cord.

---

## Tool Discovery — Your Pockets, Your Workshop, the Hardware Store

You don't carry every tool you own at all times. You carry a few essentials — phone, keys, wallet — and leave the rest where you can find them. When you need a specific tool, you go looking. The architecture handles tool discovery the same way.

| Human | Architecture | Concept |
|-------|-------------|---------|
| **Your pockets / belt** — always on you, instant access | **Always-send set** — tool definitions sent with every prompt, zero retrieval cost | Owner's daily drivers |
| **Your workshop / garage** — you own it, you know roughly where it is, you go get it when you need it | **Discoverable set** — registered in the environment, available on demand through a discovery tool | Everything else |
| **"I need something that cuts wire"** — you describe the need, search your mental model of what you have, grab the right one | **Discovery tool** — model describes what it needs in natural language, searches the catalog, loads the match | Two-step: search, then load |
| **A labeled toolbox** — you read what the wrench says on the handle, not a separate inventory sheet | **Tools self-describe** — MCP tools describe themselves via protocol, others provide manifest files. Nobody writes definitions manually | D146 |
| **The hardware store** — you don't own it yet, but you can go find and acquire it | **Marketplace / external tools** — not in your environment yet, but discoverable and installable | V3+ expansion |
| **You decide what goes in your pockets** — a carpenter carries different daily tools than a plumber | **Owner controls the always-send set** — a developer always-sends git and filesystem tools, a writer always-sends research tools | D109 |

The two-step discovery process is how humans naturally work. You don't inventory every tool in your garage before starting a project — you start working, realize you need a specific tool, go find it, and bring it back. The model does the same: starts processing, realizes it needs a capability, calls the discovery tool, loads the match, and continues.

**Where the analogy breaks — and that's fine.** Your tools don't describe themselves to you. A wrench doesn't announce "I'm a 10mm wrench, I can tighten and loosen 10mm bolts." In the digital world, tools self-describe (D146) — the architecture takes advantage of data being data. The catalog that would require manual maintenance in a physical workshop is automatic here.

---

## Gateway — Your Front Door

The Gateway is how the outside world reaches you. It doesn't care who you are (Auth handles identity) or what you're carrying (the Agent Loop handles processing). It manages the flow in and out.

| Human | Architecture |
|-------|-------------|
| Your front door — one entrance, anyone can knock | The Gateway — one entry point, any client can connect |
| You don't have a separate door for each visitor | The Gateway serves web, CLI, mobile, bots, voice, future paradigms identically |
| You remember conversations regardless of how they happened (in person, phone, text) | Conversations persist in Your Memory — start on web, continue on mobile, pick up on CLI |
| The conversation is in your memory, not in the medium | Conversations are data in Your Memory, managed by the Gateway, independent of which client connects |
| Your front door doesn't decide what you talk about | The Gateway doesn't interpret, filter, or modify content — it routes and manages conversations |
| Moving house doesn't erase your conversations | Swapping the Gateway doesn't lose conversations — they live in Your Memory |

**Where the analogy breaks — and that's fine.** Your front door doesn't manage your conversations for you. In the architecture, the Gateway actively manages conversation lifecycle (create, list, resume, store) through a dedicated conversation store tool. It's more like a receptionist who logs every visitor and every conversation topic, but never listens to the content.

---

## Auth — Your Judgment About Trust

Auth is how you decide who gets access to what. Not the front door (that's the Gateway), not your memory (that's Your Memory) — the judgment layer that sits between them.

| Human | Architecture |
|-------|-------------|
| You decide who to trust and how much | Auth controls who and what has access — today that's you, tomorrow it's collaborators and AI agents |
| You share different things with different people — your doctor knows your health, your accountant knows your finances | Per-actor permissions — each actor gets exactly the access you grant, nothing more |
| Your judgment about trust is independent of how you communicate | Auth is independent of the Gateway — both can be swapped without affecting the other (D60) |
| You don't need someone else to tell you who to trust | Auth is owner-controlled — you set the permissions, not the platform |
| Trust decisions protect what's personal | Auth protects Your Memory — every request passes through it |

**Where the analogy breaks — and that's an advantage.** Human trust is fuzzy, inconsistent, and exploitable. Digital Auth is precise, consistent, and auditable. You can't accidentally overshare because you were tired. Auth enforces the same rules every time.

---

## Models — Hired Expertise

You bring the context — your files, your history, your preferences. The model brings the reasoning. You don't need to be an expert in everything when you can hire one on demand.

| Human | Architecture |
|-------|-------------|
| Hiring an expert — you bring your documents, they bring their expertise | The model — you bring Your Memory, it brings intelligence through the Model API |
| You can switch experts (new lawyer, new accountant) without losing your files | Swap models with a config change — Your Memory stays, intelligence upgrades |
| Different experts for different tasks — a surgeon for surgery, an accountant for taxes | Different models for different tasks, from any provider, swapped per-request if needed |
| The expert works with what you give them — your records, your context | The model works with what it reads from Your Memory — your files, your instructions, your history |
| You can hire a better expert when one becomes available | When a better model ships, the system gets smarter immediately — Your Memory is what compounds |

**Where the analogy breaks — and that's an advantage.** Hiring a new human expert requires onboarding — they need to learn your history, your preferences, your context. A new model reads Your Memory and has full context instantly. The "onboarding" is reading files, not months of relationship-building. This is the superpower of separating memory from intelligence.

---

## Adapters — Travel Adapters and Translators

You speak English. The person across the table speaks French. An interpreter sits between you. You don't learn French, they don't learn English — the interpreter translates. If you travel to Japan next, you swap the interpreter. You never changed how you speak.

| Human | Architecture |
|-------|-------------|
| A travel power adapter — your device has one plug shape, the wall has another, the adapter translates | Adapters translate between internal standards and external ones — your components speak a stable interface, the adapter handles whatever the outside world uses |
| Swap the adapter when you travel to a different country | Swap the adapter when the external standard changes — components never knew the difference |
| You don't rewire your device for each country | Components don't change when external standards shift — only the adapter changes |
| The interpreter is replaceable — the conversation isn't | The adapter is replaceable — the contract it translates isn't |
| You can have multiple interpreters for multiple languages | Multiple adapters for multiple external standards — Gateway API adapter, Model API adapter |

This maps directly to D139: components communicate via contracts, contracts connect to the outside world via adapters. The swappability chain is complete: Memory via tools, components via contracts, contracts via adapters.

**Where the analogy breaks — and that's fine.** A human interpreter adds latency and can introduce errors. A well-implemented adapter is a thin, deterministic translation layer — no judgment, no interpretation, just mapping. The adapter is simpler than the interpreter.

---

## The Bootstrap — Waking Up and Checking Your Notepad

You don't wake up with your entire day loaded in your head. You check a note on your bedside table — "check calendar, review today's priorities" — and that kicks off your whole morning routine. One note leads to the next thing, which leads to the next.

| Human | Architecture |
|-------|-------------|
| The bedside notepad — one line that tells you where to start | The bootstrap prompt — "Read AGENT.md in the current folder for your instructions" (D50) |
| The note doesn't contain your whole day — it points you to where the information is | The bootstrap doesn't contain instructions — it points the model to Your Memory |
| Your morning routine unfolds from that first note | The model reads AGENT.md, discovers skills, context, personality, methodology — all from following that one pointer |
| The notepad is tiny and generic — it works regardless of what your day looks like | The bootstrap is minimal and generic — one line, works for any product built on the architecture |
| Your knowledge lives in your brain, not on the notepad | Instructions live in Your Memory, not in the bootstrap — the bootstrap just says "look here" |

This is D50 and the BIOS analogy from memory-spec. The bootstrap is Agent Loop configuration, not Memory. Implementations choose what the note says. The Architecture just defines that there is a note.

---

## Configuration — Your Preferences, Your Office, Your Equipment

Three different kinds of "setup" that people naturally distinguish but software often conflates.

| Human | Architecture | Category |
|-------|-------------|----------|
| **How you like your coffee** — personal preference that follows you everywhere | **Preferences in Your Memory** — always-send tools, interaction style, model choices. Travel with you (D145) | Personal |
| **Which desk you sit at, which building you work in** — about the location, not about you | **Runtime config / environment** — server addresses, ports, API keys. Travel with the deployment (D141-refined) | Environment |
| **What the espresso machine can do** — the machine describes its own capabilities | **Tools self-describe** — MCP tools announce their capabilities via protocol (D146) | Self-describing |

The test from D141-refined: "Is this about you, or about this desk?" If it's about you, it goes in Your Memory. If it's about the desk, it's environment config. If it's about the equipment, the equipment tells you.

When you move offices (change deployments), your coffee preference travels with you. The new office has its own desks and its own espresso machine. You don't lose your preferences, and you don't try to bring the desk.

---

## Security — Your Immune System and Your House Locks

Security in the architecture works in independent layers, just like how your body and your home protect you through different, overlapping mechanisms.

| Human | Architecture |
|-------|-------------|
| **Your skin** — first barrier, keeps most things out | **The Gateway** — validates input structure, enforces size limits, rejects malformed requests |
| **Your immune system** — recognizes threats that get past the skin | **Auth** — authenticates and authorizes every request, independent of the Gateway |
| **Your house locks** — you choose who gets a key | **Permissions** — per-actor access control, owner decides who sees what |
| **Keeping medicine in a locked cabinet** — dangerous things get extra protection | **Tool isolation** — untrusted tools run in sandboxed containers with restricted access |
| **You don't tell strangers your secrets** — compartmentalized trust | **Content separation** — primary prompt injection defense, keeping untrusted content separate from instructions |
| **Each defense works independently** — your locks still work if you get a cold | **Independent security layers** — Auth works even if a tool escapes its sandbox, tool isolation works even if Auth fails |

**Where the analogy breaks — and that's an advantage.** Your immune system can't be reconfigured. This architecture's security layers are all configurable by the owner — local deployment gives you full control (freedom), managed hosting applies stricter defaults (protection). Same code, different configuration (D23, D128).

---

## The Expanding Sphere — From Your Room to the World

Your capability grows in concentric circles. As a child, your world is your room. Then your house. Then your neighborhood. Then your city. Then the world. At each step, you gain access to more — but you're still you, with the same brain, the same memory.

| Human | Architecture | Phase |
|-------|-------------|-------|
| **Your room** — your personal space, your things | **Library folder** — library-scoped file tools, your documents | V1 |
| **Your house** — your room plus shared spaces, kitchen, garage | **Your computer** — system tools, filesystem, local apps | V2 |
| **Your neighborhood / city** — stores, services, other people | **External services** — APIs, third-party tools, remote data | V3 |
| **The world** — travel, international connections, global access | **Inbound integrations** — other systems connecting to yours | V4 |

At each expansion, you're still you. You didn't get a new brain or new memories — you gained access to more tools and more of the world's data. The architecture works the same way: each expansion is adding tools to the environment and permissions in Auth. The Agent Loop doesn't change. Your Memory doesn't change. The system absorbs scope the way you absorb a bigger world — same person, wider reach.

**Where the analogy breaks — and that's fine.** A child growing up takes years. Adding tools to the environment takes minutes. The architecture compresses what's naturally a developmental timeline into a configuration change.

---

## Managed Hosting — Hiring a Property Manager

You can own your home and manage it yourself — fix the plumbing, mow the lawn, handle the repairs. Or you can hire a property manager who handles all of that while you still own the house.

| Human | Architecture |
|-------|-------------|
| **Owning and managing your own home** — full control, full responsibility | **Local deployment** — run on your hardware, full offline capability, you manage everything |
| **Hiring a property manager** — they handle maintenance, you still own the house | **Managed hosting** — provider handles infrastructure, you still own Your Memory |
| **The manager follows your rules** — you set the budget, approve major changes | **Same code, different configuration** — managed hosting restricts tool access and enforces policies through config, not code forks (D23) |
| **You can fire the manager and manage it yourself** — you still have the house | **Memory portability** — move between deployment modes without losing anything |
| **The manager won't let you knock down load-bearing walls** — stricter than self-managed | **Managed hosting is stricter, not just easier** — curated tool allow list, enforced isolation, provider policies (D128) |

The key insight: managed hosting doesn't change ownership. Your Memory is still yours. You can export everything and move to local deployment at any time. The manager makes it easier, not permanent.

---

## Implementation Customization — Human Anatomy vs Lifestyle

Everyone has the same body plan — two arms, two legs, a brain, a heart. What you do with that body plan is entirely your choice. One person becomes a surgeon, another becomes a carpenter, another becomes a musician. Same anatomy, radically different lives.

| Human | Architecture |
|-------|-------------|
| **Human anatomy** — the universal body plan everyone shares | **Architecture** — 4 components, 2 APIs, 3 externals. Generic, unopinionated |
| **Your lifestyle** — career, routines, preferences, personality | **Implementation** — specific tools, default content, methodology, personality, brand |
| **Anatomy doesn't prescribe lifestyle** — having hands doesn't mean you must be a pianist | **Architecture doesn't prescribe product** — having an Agent Loop doesn't mean you must build a chatbot |
| **Two people with the same anatomy live very different lives** — same infrastructure, different choices | **Two products on the same Architecture look completely different** — same architecture, different Memory contents |
| **Your lifestyle choices are yours to change** — switch careers, move cities, change routines | **Implementation opinions are swappable** — change the default tools, change the methodology, change the personality |

This is D65: the Implementation is composable lego blocks, each piece independently usable. The Architecture provides the body. The product provides the life.

---

## Related Documents

[foundation-spec.md](../foundation-spec.md) (architecture overview, links to all component specs)
