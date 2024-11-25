import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
	title: "monolayer",
	description: "from local to production in one step",
	themeConfig: {
		socialLinks: [
			{ icon: "github", link: "https://github.com/monolayer/monorepo" },
		],
		footer: {
			copyright: "© monolayer.dev",
		},
	},
});
