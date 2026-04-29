import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Personal AI Architecture',
  tagline: 'A lock-in-free architecture for personal AI systems',
  favicon: 'img/paa-logo.png',

  future: {
    v4: true,
  },

  url: 'https://personalaiarchitecture.org',
  baseUrl: '/',

  organizationName: 'Personal-AI-Architecture',
  projectName: 'the-architecture',

  onBrokenLinks: 'throw',

  markdown: {
    format: 'detect',
    mermaid: true,
  },

  themes: ['@docusaurus/theme-mermaid'],

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          path: '../docs',
          sidebarPath: './sidebars.ts',
          exclude: ['**/doc-registry.json'],
          editUrl:
            'https://github.com/Personal-AI-Architecture/the-architecture/tree/main/docs/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    colorMode: {
      defaultMode: 'dark',
      disableSwitch: true,
      respectPrefersColorScheme: false,
    },
    navbar: {
      title: 'Personal AI Architecture',
      logo: {
        alt: 'Personal AI Architecture',
        src: 'img/paa-logo.png',
      },
      items: [
        {
          to: '/docs/about',
          label: 'About Us',
          position: 'right',
        },
        {
          href: 'https://community.braindrive.ai/c/personal-ai-architecture/39',
          label: 'Forum',
          position: 'right',
        },
        {
          href: 'https://github.com/Personal-AI-Architecture/the-architecture',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [],
      copyright: `Created by <a href="https://braindrive.ai" target="_blank" rel="noopener noreferrer">BrainDrive</a>. Code licensed MIT. Docs licensed CC BY 4.0.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
