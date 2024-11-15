import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
	title: "Sidecar",
	description: "A modern backend framework",
	themeConfig: {
		// https://vitepress.dev/reference/default-theme-config
		nav: [
			{ text: "Guide", link: "/guide/markdown-examples" },
			{ text: "API Reference", link: "/reference/api/modules" },
		],
		sidebar: {
			"/guide/": {
				base: "/guide",
				items: [{ text: "Markdown Examples", link: "markdown-examples" }],
			},
			"/reference/": {
				base: "/reference",
				items: require("./../reference/api/typedoc-sidebar.json"),
			},
		},
		socialLinks: [
			{ icon: "github", link: "https://github.com/vuejs/vitepress" },
		],
	},
});
