import { apiModules } from ".vitepress/sidebar-items/api-modules.mjs";
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
				link: "/guide/configuration",
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
					{
						text: "Configuring monolayer",
						link: "configuration",
					},
					schemaDefinition,
					{
						text: "Glossary",
						link: "glossary",
					},
				],
			},
			"/reference/": apiModules,
		},
		socialLinks: [
			{ icon: "github", link: "https://github.com/vuejs/vitepress" },
		],
		search: {
			provider: "local",
		},
	},
	mermaid: {},
});
