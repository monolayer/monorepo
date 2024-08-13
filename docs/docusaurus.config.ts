import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
	title: "monolayer",
	favicon: "img/favicon.ico",

  // Set the production url of your site here
  url: 'https://your-docusaurus-site.example.com',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
	organizationName: "dunkelbraun", // Usually your GitHub org/user name.
	projectName: "monolayer", // Usually your repo name.

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  markdown: {
    mermaid: true,
  },

  presets: [
    [
      'classic',
      {
        docs: {
          breadcrumbs: true,
          sidebarPath: './sidebars.ts',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl: ({
						versionDocsDirPath,
						docPath,
					}) => {
						if (docPath.match(/^api/)) {
							return;
						} else {
							return `https://github.com/dunkelbraun/monolayer/tree/main/docs/${versionDocsDirPath}/${docPath}`;
						}
					},
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

	plugins: [
		require.resolve("docusaurus-lunr-search"),
    [
      'docusaurus-plugin-typedoc',
      {
        entryPoints: [
					'../apps/monolayer/src/pg.ts',
					'../apps/monolayer/src/migration.ts',
					'../apps/monolayer/src/helpers.ts',
					'../apps/monolayer/src/zod.ts'
				],
        tsconfig: '../apps/monolayer/tsconfig.json',
				watch: process.env.TYPEDOC_WATCH,
        // TypeDoc options
        skipErrorChecking: true,
        enumMembersFormat: "table",
				groupOrder: ["Functions", "Classes", "Type Aliases", "*"],
        indexFormat: "list",
        outputFileStrategy: "members",
				parametersFormat: "table",
        propertiesFormat: "table",
        typeDeclarationFormat: "list",
      },
    ],
	],

	themeConfig: {
    // Replace with your project's social card
    image: "img/docusaurus-social-card.jpg",
    navbar: {
      title: "monolayer",
      logo: {
        alt: "My Site Logo",
        src: "img/logo.svg",
      },
      items: [
        {
          type: "docSidebar",
          sidebarId: "tutorialSidebar",
          position: "left",
          label: "Docs",
        },
        {
          type: "docSidebar",
          sidebarId: "typedocSidebar",
          position: "left",
          label: "API",
        },
        {
          href: "https://github.com/dunkelbraun/monolayer",
          label: "GitHub",
          position: "right",
        },
      ],
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
    mermaid: {
      theme: {light: 'neutral', dark: 'dark'},
    },

  } satisfies Preset.ThemeConfig,
  themes: ['@docusaurus/theme-mermaid'],
};

export default config;
