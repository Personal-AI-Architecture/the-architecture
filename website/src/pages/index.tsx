import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import styles from './index.module.css';

function Hero(): ReactNode {
  return (
    <header className={styles.heroBanner}>
      <div className="container">
        <h1 className={styles.heroTitle}>
          Big Tech locks you in. Personal AI sets you free.
        </h1>
        <p className={styles.heroSubtitle}>
          Your conversations, your preferences, your data — owned by you, not the app.
        </p>
        <div className={styles.comparison}>
          <img
            src="/img/comparison-traditional.png"
            alt="Traditional architectures: the App is the platform. Remove the app, lose everything."
            className={styles.comparisonPanel}
          />
          <div className={styles.comparisonVs} aria-hidden="true">VS</div>
          <img
            src="/img/comparison-this.png"
            alt="This architecture: Your Memory is the platform. Swap anything above, your Memory stays."
            className={styles.comparisonPanel}
          />
        </div>
        <div className={styles.buttons}>
          <Link className="button button--primary button--lg" to="https://github.com/Personal-AI-Architecture/the-architecture#readme">
            Learn How It Works
          </Link>
        </div>
      </div>
    </header>
  );
}

const components = [
  {
    title: 'Your Memory',
    description:
      'The platform. Your data, config, preferences, and conversations. Everything else depends on it — it depends on nothing.',
    link: '/docs/memory-spec',
  },
  {
    title: 'Agent Loop',
    description:
      'The agent loop. Sends messages to the model, executes tool calls, repeats until done. New capabilities arrive by adding tools.',
    link: '/docs/engine-spec',
  },
  {
    title: 'Gateway',
    description:
      'The front door. Web app, CLI, mobile app, Discord bot — any interface connects through it. Start on one, continue on another.',
    link: '/docs/gateway-spec',
  },
  {
    title: 'Auth',
    description:
      'Controls access to your system. Independent of every other component — swap anything else, auth doesn\'t change.',
    link: '/docs/auth-spec',
  },
];

const apis = [
  {
    title: 'Gateway API',
    description:
      'How your interfaces connect to the system. Any client that speaks the protocol works — web app, CLI, mobile app, Discord bot.',
    link: '/docs/gateway-spec',
  },
  {
    title: 'Model API',
    description:
      'How the agent loop connects to AI models. Swap providers with a config change — no code changes required.',
    link: '/docs/models-spec',
  },
];

function Components(): ReactNode {
  return (
    <section className={styles.principles}>
      <div className="container">
        <h2 className={styles.sectionTitle}>
          Your Memory is the platform. Everything else is swappable.
        </h2>
        <h3 className={styles.sectionTitleSmall}>Four Components</h3>
        <div className={styles.principlesGrid}>
          {components.map((component) => (
            <Link key={component.title} to={component.link} className={styles.principleCard}>
              <h3>{component.title}</h3>
              <p>{component.description}</p>
            </Link>
          ))}
        </div>
        <h3 className={styles.sectionTitleSmall}>Two APIs</h3>
        <div className={styles.apisGrid}>
          {apis.map((api) => (
            <Link key={api.title} to={api.link} className={styles.principleCard}>
              <h3>{api.title}</h3>
              <p>{api.description}</p>
            </Link>
          ))}
        </div>
        <p className={styles.closer}>
          Runs on a laptop. Use any model, tool, or interface.
        </p>
      </div>
    </section>
  );
}



function CTA(): ReactNode {
  return (
    <section className={styles.cta}>
      <div className="container">
        <h2 className={styles.sectionTitle}>Try Building On It</h2>
        <p className={styles.sectionSubtitle}>
          We're building on this ourselves. Looking for a few developers who want to do the same.
        </p>
        <div className={styles.ctaSteps}>
          <div className={styles.ctaStep}>
            <div className={styles.stepNumber}>1</div>
            <h3>Read the Architecture</h3>
            <p>Start with the README — what's in the repo, what to read next, and how everything connects.</p>
            <Link className="button button--primary" to="https://github.com/Personal-AI-Architecture/the-architecture#readme">
              View on GitHub
            </Link>
          </div>
          <div className={styles.ctaStep}>
            <div className={styles.stepNumber}>2</div>
            <h3>Build a System</h3>
            <p>Start from the TypeScript template — running locally in 5 minutes, with conformance tests built in.</p>
            <Link
              className="button button--primary"
              to="https://github.com/Personal-AI-Architecture/ts-architecture-template"
            >
              Get the Template
            </Link>
          </div>
          <div className={styles.ctaStep}>
            <div className={styles.stepNumber}>3</div>
            <h3>Share What You Find</h3>
            <p>What worked, what broke, what's missing — we want to hear it.</p>
            <Link
              className="button button--primary"
              to="https://community.braindrive.ai/c/personal-ai-architecture/39"
            >
              Join the Forum
            </Link>
          </div>
        </div>
        <p className={styles.notDeveloper}>
          Not a developer?{' '}
          <Link to="https://braindrive.ai">See BrainDrive</Link> — a working system built on this
          architecture, with a{' '}
          <Link to="https://community.braindrive.ai/t/how-to-succeed-with-ai-course-introduction/233/6">
            free course
          </Link>{' '}
          to get you started.
        </p>
      </div>
    </section>
  );
}

export default function Home(): ReactNode {
  return (
    <Layout
      title="Personal AI Architecture"
      description="Big Tech locks you in. Personal AI sets you free. An open architecture for personal AI systems — your data, your control."
    >
      <Hero />
      <Components />
      <CTA />
    </Layout>
  );
}
