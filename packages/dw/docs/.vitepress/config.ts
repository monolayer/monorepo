import { defineConfig } from "vitepress";
// https://vitepress.dev/reference/site-config
export default defineConfig({
	title: "DW",
	base: "/dw-docs",
	description: "Write Dockerfiles programatically",
	themeConfig: {
		// https://vitepress.dev/reference/default-theme-config
		nav: [
			{ text: "Guide", link: "/guide/quick-start" },
			{ text: "API Reference", link: "/reference/api/globals" },
		],
		sidebar: {
			"/guide/": {
				base: "/guide/",
				items: [
					{ text: "Quick Start", link: "quick-start" },
					{
						text: "Usage",
						collapsed: false,
						items: [
							{ text: "Write", link: "write" },
							{ text: "Save", link: "save" },
							{ text: "Validate", link: "validate" },
							{ text: "Reuse", link: "reuse" },
						],
					},
					{
						base: "/reference",
						text: "API reference",
						link: "/api/globals",
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
