import { defineConfig } from "vitepress";
// https://vitepress.dev/reference/site-config
export default defineConfig({
	title: "Sample",
	base: "/sample",
	description: "TBD",
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
