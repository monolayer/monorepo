import { defineConfig } from "vitepress";
// https://vitepress.dev/reference/site-config
export default defineConfig({
	title: "monolayer SDK",
	base: "/sdk-docs",
	description: "The backend sidecar framework",
	themeConfig: {
		// https://vitepress.dev/reference/default-theme-config
		nav: [
			{ text: "Quick Start", link: "/guide/quick-start" },
			{ text: "API Reference", link: "/reference/api/modules" },
		],
		sidebar: {
			"/guide/": {
				base: "/guide/",
				items: [
					{
						text: "Introduction",
						items: [
							{ text: "Installation", link: "installation" },
							{ text: "Quick Start", link: "quick-start" },
						],
					},
					{
						text: "Workload types",
						items: [
							{
								text: "Stateful",
								items: [
									{ text: "PostgresDatabase", link: "postgres" },
									{ text: "MySqlDatabase", link: "mysql" },
									{ text: "Bucket", link: "bucket" },
									{ text: "Redis", link: "redis" },
								],
							},
							{
								text: "Stateless",
								items: [
									{ text: "Cron", link: "cron" },
									{ text: "Task", link: "task" },
								],
							},
						],
					},
					{
						text: "Configuration",
						link: "configuration",
					},
					{ text: "Testing helpers", link: "testing" },
					{
						base: "/reference",
						text: "CLI & API reference",
						link: "/api/modules",
					},
				],
			},
			"/reference/": {
				base: "/reference",
				items: [
					{
						text: "Modules",
						items: require("./../reference/api/typedoc-sidebar.json"),
					},
					{
						text: "Command Line Interface",
						items: [
							{ text: "start dev", link: "/cli/start-dev" },
							{ text: "start test", link: "/cli/start-test" },
							{ text: "stop dev", link: "/cli/stop-dev" },
							{ text: "stop test", link: "/cli/stop-test" },
							{ text: "status dev", link: "/cli/status-dev" },
							{ text: "status test", link: "/cli/status-dev" },
							{ text: "trigger cron", link: "/cli/trigger-cron" },
							{ text: "build", link: "/cli/build" },
							{ text: "pull", link: "/cli/pull" },
						],
					},
				],
			},
		},
		socialLinks: [
			{
				icon: "github",
				link: "https://github.com/monolayer/monorepo/tree/main/packages/sdk",
			},
		],
		search: {
			provider: "local",
		},
	},
});
