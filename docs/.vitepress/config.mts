import { withMermaid } from "vitepress-plugin-mermaid";
import { generateSidebar } from "vitepress-sidebar";
import typedocSidebar from "./../reference/api/typedoc-sidebar.json";

// https://vitepress.dev/reference/site-config
export default withMermaid({
	title: "monolayer",
	description: "A VitePress Site",
	themeConfig: {
		// https://vitepress.dev/reference/default-theme-config
		nav: [
			{
				text: "Guide",
				link: "/guide/intro",
				activeMatch: "/guide/",
			},
			{
				text: "Reference",
				link: "/reference/api",
				activeMatch: "/reference/",
			},
		],

		sidebar: {
			...generateSidebar([
				{
					documentRootPath: "docs",
					scanStartPath: "guide",
					resolvePath: "/guide/",
					useTitleFromFileHeading: true,
				},
			]),
			"/reference/": {
				base: "/reference/",
				items: [
					{
						text: "API",
						collapsed: true,
						base: "/api/",
						items: typedocSidebar,
					},
					{
						text: "Command Line Interface",
						items: [
							{ text: "Intro", link: "cli" },
							{
								text: "Commands",
								items: [
									{
										text: "db",
										collapsed: true,
										items: [
											{ text: "create", link: "cli/db/create" },
											{ text: "drop", link: "cli/db/drop" },
											{ text: "import", link: "cli/db/import" },
											{ text: "reset", link: "cli/db/reset" },
											{ text: "seed", link: "cli/db/seed" },
										],
									},
									{
										text: "migrate",
										collapsed: true,
										items: [
											{ text: "all", link: "cli/migrate/all" },
											{ text: "alter", link: "cli/migrate/alter" },
											{ text: "contract", link: "cli/migrate/contract" },
											{ text: "data", link: "cli/migrate/data" },
											{ text: "expand", link: "cli/migrate/expand" },
											{ text: "rollback", link: "cli/migrate/rollback" },
										],
									},
									{ text: "generate", link: "cli/generate" },
									{ text: "pending", link: "cli/pending" },
									{ text: "scaffold", link: "cli/scaffold" },
								],
							},
						],
					},
				],
			},
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
