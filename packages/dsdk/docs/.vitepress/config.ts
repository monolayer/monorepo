import { defineConfig } from "vitepress";
// https://vitepress.dev/reference/site-config

const referenceSidebar = require("./../reference/api/typedoc-sidebar.json");

export default defineConfig({
	title: "DSDK",
	base: "/dsdk-docs",
	description: "TypeScript SDK interact with the Docker Engine API",
	themeConfig: {
		// https://vitepress.dev/reference/default-theme-config
		nav: [
			{ text: "Guide", link: "/guide/quick-start" },
			{ text: "API Reference", link: "/reference/api/modules" },
		],
		sidebar: {
			"/guide/": {
				base: "/guide/",
				items: [
					{ text: "Quick Start", link: "quick-start" },
					{ text: "Examples", link: "examples" },
					{
						base: "/reference",
						text: "API reference",
						link: "/api/modules",
					},
				],
			},
			"/reference/": {
				base: "/reference",
				items: require("./../reference/api/typedoc-sidebar.json"),
			},
		},
		socialLinks: [
			{
				icon: "github",
				link: "https://github.com/monolayer/monorepo/tree/main/packages/dw",
			},
		],
		search: {
			provider: "local",
		},
	},
});
