import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
	title: "pg-zod",
	base: "/pg-zod-docs",
	description: "A VitePress Site",
	themeConfig: {
		nav: [
			{ text: "Guide", link: "/guide/what-is-pg-zod" },
			{ text: "API Reference", link: "/api/globals" },
		],
		sidebar: [
			{
				text: "Guide",
				base: "/guide",
				collapsed: false,
				items: [
					{ text: "What is pg-zod?", link: "/what-is-pg-zod" },
					{ text: "Installation", link: "/installation" },
					{ text: "Using schemas", link: "/using-schema" },
					{ text: "Input and output types", link: "/input-output-types" },
					{ text: "Column Validations", link: "/column-validations" },
				],
			},
			{
				text: "API Reference",
				collapsed: false,
				items: [
					{ text: "Globals", link: "/api/globals" },
					...require("../api/typedoc-sidebar.json"),
				],
			},
		],
		socialLinks: [
			{ icon: "github", link: "https://github.com/dunkelbraun/monolayer-pg" },
		],
	},
});
