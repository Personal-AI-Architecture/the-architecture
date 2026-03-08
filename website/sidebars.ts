import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  principlesSidebar: [
    'principles',
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
        'gateway-spec',
        'auth-spec',
      ],
    },
    {
      type: 'category',
      label: 'APIs & Contracts',
      collapsed: false,
      items: [
        'gateway-engine-contract',
        'models-spec',
        'adapter-spec',
      ],
    },
    {
      type: 'category',
      label: 'Cross-Cutting',
      collapsed: true,
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
    'foundation-spec',
    {
      type: 'category',
      label: 'Core Specs',
      collapsed: false,
      items: [
        'memory-spec',
        'engine-spec',
        'gateway-spec',
        'auth-spec',
        'gateway-engine-contract',
        'models-spec',
        'adapter-spec',
        'tools-spec',
        'security-spec',
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
