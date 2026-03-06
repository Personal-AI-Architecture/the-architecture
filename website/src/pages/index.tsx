import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function HomepageHeader() {
  return (
    <header className={styles.heroBanner}>
      <div className="container">
        <Heading as="h1" className={styles.heroTitle}>
          Personal AI Architecture
        </Heading>
        <p className={styles.heroSubtitle}>
          An open architecture for building AI systems that you own, control, and can swap any part of — including the architecture itself.
        </p>
        <div className={styles.buttons}>
          <Link
            className="button button--primary button--lg"
            to="/docs/foundation-spec">
            Read the Architecture
          </Link>
          <Link
            className="button button--outline button--lg"
            to="/docs/principles/interfaces-over-implementations">
            Explore the Principles
          </Link>
        </div>
      </div>
    </header>
  );
}

function ManifestoSection() {
  return (
    <section className={styles.manifesto}>
      <div className="container">
        <div className={styles.manifestoContent}>
          <Heading as="h2">The Problem</Heading>
          <p>
            AI systems today lock you in. Your conversations, your preferences, your context —
            trapped inside products you don't control. Cancel your subscription and everything
            that made the AI useful to you disappears. Switch providers and you start from zero.
          </p>
          <p>
            This isn't a bug. It's the business model. The more context you give the AI, the
            harder it is to leave. Your own data becomes the wall that keeps you in.
          </p>

          <Heading as="h2">The Architecture</Heading>
          <p>
            The Personal AI Architecture is a lock-in-free foundation for personal AI systems.
            Four components, two connectors, five principles — designed so that every piece is
            replaceable, including the architecture itself.
          </p>

          <div className={styles.architectureDiagram}>
            <pre>{`
  Clients  →  Gateway API  →  Gateway  →  Engine  →  Provider API  →  Models
 (external)   (connector)   (component) (component)   (connector)    (external)
                                            │
                     ─── Auth ───           └──→ Tools
                     (cross-cutting)
                                  ┌─────────────────────────┐
                                  │       YOUR MEMORY        │
                                  │      (the platform)      │
                                  └─────────────────────────┘
            `}</pre>
          </div>

          <p>
            <strong>Your Memory is the platform.</strong> Everything else — Engine, Auth, Gateway,
            clients, models, tools — exists to serve it. Swap any component. Upgrade any model.
            Change any client. Your Memory persists. It compounds. Every conversation makes the
            system more powerful because it makes your memory richer.
          </p>

          <Heading as="h2">The Invitation</Heading>
          <p>
            This is not a finished product announcement. It's an invitation to a public
            architecture discussion. We believe lock-in-free AI is imperative for the future
            of AI, economies, and societies. The architecture is published, tested (243 tests),
            and documented (13 specs). But it's not done — and it shouldn't be done by one team.
          </p>
          <p>
            Read the specs. Challenge the principles. Propose changes. Build on it.
          </p>

          <div className={styles.buttons}>
            <Link
              className="button button--primary button--lg"
              to="/docs/foundation-spec">
              Read the Foundation Spec
            </Link>
            <Link
              className="button button--outline button--lg"
              href="https://github.com/PersonalAIArchitecture/personal-ai-architecture">
              View on GitHub
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function PrinciplesOverview() {
  const principles = [
    {
      title: 'Interfaces Over Implementations',
      description: 'Every component is defined by what it does, not how it works. This is what makes one-component swaps possible.',
      link: '/docs/principles/interfaces-over-implementations',
    },
    {
      title: 'Memory Is the Platform',
      description: 'Everything else exists to serve Memory. The most portable, most independent, most durable part of the system.',
      link: '/docs/principles/memory-is-the-platform',
    },
    {
      title: 'Everything Else Is Swappable',
      description: 'Engine, Auth, Gateway, clients, models, tools, contracts, hosting — all replaceable. Every piece is a drop-down menu, not a permanent choice.',
      link: '/docs/principles/everything-else-is-swappable',
    },
    {
      title: 'Start Constrained, Expand Deliberately',
      description: 'Each expansion — broader scope, more tools, external integrations — is a deliberate step, not a default.',
      link: '/docs/principles/start-constrained-expand-deliberately',
    },
    {
      title: 'Complexity Is Lock-In',
      description: 'If the system requires a team of developers, you\'re locked in to that team. Four components and two connectors isn\'t minimalism — it\'s freedom.',
      link: '/docs/principles/complexity-is-lockin',
    },
  ];

  return (
    <section className={styles.principles}>
      <div className="container">
        <Heading as="h2" className={styles.sectionTitle}>Five Principles</Heading>
        <p className={styles.sectionSubtitle}>
          Nothing enforces these principles. You can bypass adapters, hardcode a provider, or
          couple components directly — the system still works. But every violation is a lock-in
          you've chosen to accept.
        </p>
        <div className={styles.principlesGrid}>
          {principles.map((principle, idx) => (
            <Link key={idx} to={principle.link} className={styles.principleCard}>
              <Heading as="h3">{`${idx + 1}. ${principle.title}`}</Heading>
              <p>{principle.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home(): ReactNode {
  return (
    <Layout
      title="A lock-in-free architecture for personal AI systems"
      description="An open architecture for building AI systems that you own, control, and can swap any part of — including the architecture itself. Four components, two connectors, five principles.">
      <HomepageHeader />
      <main>
        <ManifestoSection />
        <PrinciplesOverview />
      </main>
    </Layout>
  );
}
