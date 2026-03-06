import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Personal AI Architecture',
  tagline: 'A lock-in-free architecture for personal AI systems',
  favicon: 'img/favicon.ico',

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
  },

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
    announcementBar: {
      id: 'draft_notice',
      content:
        '<b>This architecture is a living draft.</b> Some questions are still open — <a href="https://discuss.personalaiarchitecture.com">join the discussion</a>.',
      isCloseable: true,
    },
    colorMode: {
      defaultMode: 'dark',
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Personal AI Architecture',
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'principlesSidebar',
          position: 'left',
          label: 'Principles',
        },
        {
          type: 'docSidebar',
          sidebarId: 'architectureSidebar',
          position: 'left',
          label: 'Architecture',
        },
        {
          type: 'docSidebar',
          sidebarId: 'specsSidebar',
          position: 'left',
          label: 'Specs',
        },
        {
          to: '/about',
          label: 'About',
          position: 'left',
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
      links: [
        {
          title: 'Architecture',
          items: [
            {
              label: 'The Architecture',
              to: '/docs/foundation-spec',
            },
            {
              label: 'Principles',
              to: '/docs/principles/interfaces-over-implementations',
            },
            {
              label: 'Foundation Spec',
              to: '/docs/foundation-spec',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'GitHub Discussions',
              href: 'https://discuss.personalaiarchitecture.com',
            },
            {
              label: 'GitHub Issues',
              href: 'https://github.com/Personal-AI-Architecture/the-architecture/issues',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/Personal-AI-Architecture/the-architecture',
            },
            {
              label: 'npm',
              href: 'https://www.npmjs.com/package/@personalaiarchitecture/core',
            },
          ],
        },
      ],
      copyright: `Created by <a href="https://braindrive.ai" target="_blank" rel="noopener noreferrer">BrainDrive</a>. Code licensed MIT. Docs licensed CC BY 4.0.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
