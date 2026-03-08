import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import styles from './index.module.css';

function Hero(): ReactNode {
  return (
    <header className={styles.heroBanner}>
      <div className="container">
        <h1 className={styles.heroTitle}>A Foundation for Building Personal AI Systems</h1>
        <img
          src="/img/comparison.png"
          alt="Comparison: Traditional architectures where the App is the platform versus this architecture where Your Memory is the platform"
          className={styles.heroComparison}
        />
        <div className={styles.buttons}>
          <Link className="button button--primary button--lg" to="/docs/foundation-spec">
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
        <h2 className={styles.sectionTitle}>Four Components</h2>
        <p className={styles.sectionSubtitle}>
          Each one is independent. Each one is swappable. Your Memory is the only one that stays.
        </p>
        <div className={styles.principlesGrid}>
          {components.map((component) => (
            <Link key={component.title} to={component.link} className={styles.principleCard}>
              <h3>{component.title}</h3>
              <p>{component.description}</p>
            </Link>
          ))}
        </div>
        <h2 className={styles.sectionTitleSmall}>Two APIs</h2>
        <div className={styles.apisGrid}>
          {apis.map((api) => (
            <Link key={api.title} to={api.link} className={styles.principleCard}>
              <h3>{api.title}</h3>
              <p>{api.description}</p>
            </Link>
          ))}
        </div>
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
          We're building a product on this architecture ourselves and sharing what we learn along
          the way. We're looking for a few developers who care about this problem enough to do the
          same.
        </p>
        <div className={styles.ctaSteps}>
          <div className={styles.ctaStep}>
            <div className={styles.stepNumber}>1</div>
            <h3>Read the Architecture</h3>
            <p>Understand the four components, two APIs, and why every piece is swappable.</p>
            <Link className="button button--primary" to="/docs/foundation-spec">
              Foundation Spec
            </Link>
          </div>
          <div className={styles.ctaStep}>
            <div className={styles.stepNumber}>2</div>
            <h3>Build a System</h3>
            <p>Use the reference implementation as a starting point.</p>
            <code>npm install @personalaiarchitecture/core</code>
          </div>
          <div className={styles.ctaStep}>
            <div className={styles.stepNumber}>3</div>
            <h3>Share What You Find</h3>
            <p>What worked, what broke, what's missing — we want to hear it.</p>
            <Link
              className="button button--outline"
              to="https://discuss.personalaiarchitecture.org"
            >
              Join the Forum
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home(): ReactNode {
  return (
    <Layout
      title="Personal AI Architecture"
      description="Use any interface, any model, any tool. Even the system itself is swappable."
    >
      <Hero />
      <Components />
      <CTA />
    </Layout>
  );
}
