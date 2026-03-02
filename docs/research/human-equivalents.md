# Human Equivalents — How the Architecture Maps to Human Experience

> **Project:** Pivot — Personal AI Architecture
> **Purpose:** Map architectural concepts to human equivalents, making abstract design decisions intuitive
> **Status:** Active — expand as new mappings emerge

---

## Why This Document Exists

The architecture makes claims that sound abstract — "tools are not a component," "memory is the platform," "everything is swappable except memory." These claims become obvious when you map them to how humans already work. This document captures those mappings.

---

## The Three Levels

### Level 1: You — The System Itself

A person has a brain and a body. The brain holds memory, applies intelligence, and controls access (who gets to know what about you). The body executes — it does what the brain decides.

| Human | Architecture | Notes |
|-------|-------------|-------|
| **Brain** | Memory + Models (intelligence) + Auth | The brain remembers, reasons, and decides who to trust |
| **Body** | Engine | Executes what the brain decides — the hands that do the work |
| **You (the whole person)** | The 4 components together | Brain + body = a functioning person. Memory + Engine + Auth + Gateway = a functioning system |

**Where the analogy breaks — and that's an advantage.** In the human world, you can't swap your brain or upgrade your body. In the digital world, you can. Every component except Memory is swappable and upgradeable. Better intelligence? Swap the model. Better execution? Swap the Engine. Better access control? Swap Auth. The one thing you can't swap is the one thing that makes you *you* — Your Memory. Your Memory is Your Memory.

This is the digital advantage: everything that's infrastructure can improve without losing what's personal.

### Level 2: Internal Tools — How the Brain and Body Work Together

In a human, remembering and recalling aren't "tools you use" — they're just how your brain works. You don't think of reaching for a memory as picking up a tool.

In the architecture, Memory access is mediated through tools (read, write, search) because of the zero-dependency principle — Memory can't depend on the Engine. The Engine accesses Memory through explicit interfaces. But functionally, these are internal operations, not tools you "hold." They're the nervous system — how the body accesses what the brain knows.

| Human | Architecture |
|-------|-------------|
| Remembering something | Memory read tool |
| Learning / storing a new fact | Memory write tool |
| Searching your memory for something relevant | Memory search tool |
| Your nervous system (connects brain to body) | The tool interface between Engine and Memory |

### Level 3: External Tools — What Your Hands Hold

This is where the real tool analogy kicks in. Humans make tools, use tools made by others, own some tools, pay to use others, and pay people to use tools on them.

| Human | Architecture |
|-------|-------------|
| Tools you own (your hammer, your screwdriver) | Tools in your environment — installed locally, you control them |
| Tools you pay to use (renting equipment, gym membership) | External tool services — third-party APIs, hosted MCP servers |
| Paying someone to use tools for you (hiring a contractor) | Engine + Model — intelligence you pay for (Provider API) that uses tools on your behalf |
| Your workshop / toolshed | The tool environment — what's installed and available |
| Buying a new tool | Installing a new tool in the environment |
| Learning a new skill (how to use a tool) | A skill file in Your Memory — instructions that reference tools |

**Ownership split:**
- **Tools I own** (in my environment) — my hammer, my screwdriver. I control them. I take them when I move.
- **Tools I don't own** (external to environment) — the ATM, the grocery store, the postal service. I use them, but they're someone else's infrastructure.

### The Hand Doesn't Care

The hand doesn't know or need to know if the tool you're using is yours or someone else's — it just needs to use it. Same with the Engine. It grips and executes. It doesn't care about ownership, origin, or where the tool came from.

That's Auth's job — deciding *whether* you can use a tool. That's Memory's job — knowing *which* tools you prefer. The hand just executes. A tool is a tool.

---

## Moving Cities — The Portability Analogy

When you move to a new city:

| What you do | What it maps to |
|-------------|----------------|
| **Take your stuff** (car, clothes, furniture) | **Take Your Memory** — your data, your preferences, your skills, your history |
| **Leave the infrastructure** (roads, buildings, utilities) | **Leave the components** — the new system has its own Engine, Gateway, Auth |
| **Find equivalent services** (new grocery store, new doctor, new bank) | **Find equivalent tools** — the ecosystem has the same MCP servers, CLI tools, APIs |
| **Reconfigure logistics** (new address, new routes, new accounts) | **Reconfigure plumbing** — server addresses, ports, API keys (environment config) |

You don't lose capability when you move because the new city has roads and stores too. What makes the new house *yours* is the stuff you brought — Your Memory.

Your skills also travel with you. You know how to drive, you know which stores you need, you know your routines. In the architecture, skills are markdown files in Your Memory — they tell the new system "I need a git tool and a filesystem tool and here's how I use them." The new system wires them up.

**The one real risk:** a tool that's not ecosystem-standard. If you depend on a proprietary tool that only exists in one system, that's lock-in through the tool layer. But that's the tool vendor's lock-in, not the architecture's — and the architecture is designed so you always have alternatives. You don't need a tool management department between you and your hammer — you just pick it up and use it.

---

## Future Sections

Mappings to add as the architecture evolves:

- **Gateway as your front door** — how you receive visitors, who gets in, how conversations are managed
- **Auth as your judgment** — who you trust, what you share, how you protect yourself
- **Models as hired expertise** — you bring the context, they bring the reasoning
- **The expanding sphere** — from your room, to your house, to your neighborhood, to the world
- **Managed hosting** — hiring a property manager vs. owning your own home

---

## Related Documents

`foundation-spec.md` (architecture overview, links to all component specs)
