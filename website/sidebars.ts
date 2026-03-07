import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  principlesSidebar: [
    {
      type: 'category',
      label: 'Architecture Principles',
      collapsed: false,
      items: [
        'principles/interfaces-over-implementations',
        'principles/memory-is-the-platform',
        'principles/everything-else-is-swappable',
        'principles/start-constrained-expand-deliberately',
        'principles/complexity-is-lockin',
      ],
    },
  ],

  architectureSidebar: [
    'foundation-spec',
    'memory-as-platform',
    {
      type: 'category',
      label: 'Components',
      collapsed: false,
      items: [
        'memory-spec',
        'engine-spec',
        'auth-spec',
        'gateway-spec',
      ],
    },
    {
      type: 'category',
      label: 'Connectors & Contracts',
      collapsed: false,
      items: [
        'models-spec',
        'adapter-spec',
        'gateway-engine-contract',
      ],
    },
    {
      type: 'category',
      label: 'Cross-Cutting',
      collapsed: false,
      items: [
        'tools-spec',
        'security-spec',
        'communication-principles',
        'configuration-spec',
        'customization-spec',
        'deployment-spec',
      ],
    },
  ],

  specsSidebar: [
    {
      type: 'category',
      label: 'Core Specs',
      collapsed: false,
      items: [
        'memory-spec',
        'engine-spec',
        'auth-spec',
        'gateway-spec',
        'models-spec',
        'tools-spec',
        'security-spec',
        'adapter-spec',
        'gateway-engine-contract',
        'communication-principles',
        'configuration-spec',
        'customization-spec',
        'deployment-spec',
      ],
    },
    {
      type: 'category',
      label: 'Verification & Auditing',
      collapsed: true,
      items: [
        'foundation-verification',
        'lockin-audit',
        'lockin-gate',
        'zero-lockin-checklist',
        'doc-maintenance-spec',
      ],
    },
    {
      type: 'category',
      label: 'Guides',
      collapsed: true,
      items: [
        'guides/guides-spec',
        'guides/implementers-reference',
        {
          type: 'category',
          label: 'Conformance Tests',
          items: [
            'guides/conformance/README',
            'guides/conformance/arch-tests',
            'guides/conformance/deploy-tests',
            'guides/conformance/fs-tests',
            'guides/conformance/swap-tests',
          ],
        },
      ],
    },
    {
      type: 'category',
      label: 'Research',
      collapsed: true,
      items: [
        'research/memory-tool-completeness',
        'research/lock-in-analysis',
        'research/ecosystem-concept',
        'research/human-equivalents',
      ],
    },
  ],
};

export default sidebars;
