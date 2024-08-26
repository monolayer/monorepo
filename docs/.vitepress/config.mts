import { apiModules } from ".vitepress/sidebar-items/api-modules.mjs";
import { introduction } from ".vitepress/sidebar-items/introduction.mjs";
import { migrationSystem } from ".vitepress/sidebar-items/migration-system.mjs";
import { recipes } from ".vitepress/sidebar-items/recipes.mjs";
import { schemaDefinition } from ".vitepress/sidebar-items/schema-definition.mjs";
import { withMermaid } from "vitepress-plugin-mermaid";

// https://vitepress.dev/reference/site-config
export default withMermaid({
	title: "monolayer",
	description: "A VitePress Site",
	themeConfig: {
		// https://vitepress.dev/reference/default-theme-config
		nav: [
			{
				text: "Guide",
				link: "/guide/introduction/what-is-monolayer",
				activeMatch: "/guide/",
			},
			{
				text: "API Reference",
				link: "/reference/api",
				activeMatch: "/reference/",
			},
		],

		sidebar: {
			"/guide/": {
				collapsed: false,
				base: "/guide/",
				items: [
					introduction,
					{
						text: "Configuring monolayer",
						link: "configuration",
					},
					schemaDefinition,
					migrationSystem,
					recipes,
					{
						text: "Command Line Interface",
						link: "cli",
					},
				],
			},
			"/reference/": apiModules,
		},
		socialLinks: [
			{ icon: "github", link: "https://github.com/dunkelbraun/monolayer" },
		],
		search: {
			provider: "local",
		},
	},
	mermaid: {},
});
