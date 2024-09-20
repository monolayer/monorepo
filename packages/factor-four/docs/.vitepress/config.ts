import { defineConfig } from "vitepress";
import { apiModules } from "./sidebar-items/api-modules.mjs";

// https://vitepress.dev/reference/site-config
export default defineConfig({
	title: "Factor Four",
	description: "A VitePress Site",
	themeConfig: {
		nav: [
			{ text: "Guide", link: "/guide" },
			{ text: "Reference", link: "/reference/api/index" },
		],

		sidebar: {
			"/reference/": {
				base: "/reference/",
				...apiModules,
			},
		},

		socialLinks: [
			{ icon: "github", link: "https://github.com/dunkelbraun/factor-four" },
		],
	},
});
