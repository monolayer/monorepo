import { defineConfig, type DefaultTheme } from "vitepress";
// https://vitepress.dev/reference/site-config
export default defineConfig({
	title: "Sidecar",
	description: "A modern backend framework",
	themeConfig: {
		// https://vitepress.dev/reference/default-theme-config
		nav: [
			{ text: "Guide", link: "/guide/markdown-examples" },
			{ text: "API Reference", link: "/reference/api/globals" },
		],
		sidebar: {
			"/guide/": {
				base: "/guide",
				items: [{ text: "Markdown Examples", link: "markdown-examples" }],
			},
			"/reference/": {
				base: "/reference",
				items: [
					...(require("./../reference/api/typedoc-sidebar.json") ?? []).filter(
						(item: DefaultTheme.SidebarItem) =>
							["Workloads", "Testing"].includes(item.text),
					),
					{
						text: "Other",
						collapsed: true,
						items: (
							require("./../reference/api/typedoc-sidebar.json") ?? []
						).filter(
							(item: DefaultTheme.SidebarItem) =>
								!["Workloads", "Testing"].includes(item.text),
						),
					},
				],
			},
		},
		socialLinks: [
			{ icon: "github", link: "https://github.com/vuejs/vitepress" },
		],
	},
});
