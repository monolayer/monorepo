// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

import { themes as prismThemes } from "prism-react-renderer";

/** @type {import('@docusaurus/types').Config} */
const config = {
	title: "monolayer",
	favicon: "img/favicon.ico",

	// Set the production url of your site here
	url: "https://your-docusaurus-site.example.com",
	// Set the /<baseUrl>/ pathname under which your site is served
	// For GitHub pages deployment, it is often '/<projectName>/'
	// baseUrl: "/",
	baseUrl: "/",
	// GitHub pages deployment config.
	// If you aren't using GitHub pages, you don't need these.
	organizationName: "dunkelbraun", // Usually your GitHub org/user name.
	projectName: "monolayer", // Usually your repo name.

	onBrokenLinks: "throw",
	onBrokenMarkdownLinks: "warn",

	// Even if you don't use internationalization, you can use this field to set
	// useful metadata like html lang. For example, if your site is Chinese, you
	// may want to replace "en" with "zh-Hans".
	i18n: {
		defaultLocale: "en",
		locales: ["en"],
	},

	presets: [
		[
			"classic",
			/** @type {import('@docusaurus/preset-classic').Options} */
			({
				docs: {
					breadcrumbs: true,
					sidebarPath: "./sidebars.js",
					// Please change this to your repo.
					// Remove this to remove the "edit this page" links.
					editUrl: ({
						version,
						versionDocsDirPath,
						docPath,
						permalink,
						locale,
					}) => {
						if (docPath.match(/^api/)) {
							return;
						} else {
							return `https://github.com/dunkelbraun/monolayer/tree/main/docs/${versionDocsDirPath}/${docPath}`;
						}
					},
				},
				theme: {
					customCss: "./src/css/custom.css",
				},
			}),
		],
	],

	plugins: [
		require.resolve("docusaurus-lunr-search"),
    [
      'docusaurus-plugin-typedoc',
      {
        entryPoints: [
					'../packages/monolayer/src/configuration.ts',
					'../packages/monolayer/src/pg.ts',
					'../packages/monolayer/src/revision.ts',
					'../packages/monolayer/src/zod.ts'
				],
        tsconfig: '../packages/monolayer/tsconfig.json',
				parametersFormat: "table",
				watch: process.env.TYPEDOC_WATCH,
				groupOrder: ["Functions", "Classes", "Type Aliases", "*"],
      },
    ],
	],

	themeConfig:
		/** @type {import('@docusaurus/preset-classic').ThemeConfig} */
		({
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
		}),
};

export default config;
