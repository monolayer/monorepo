import { defineConfig } from "vitepress";
// https://vitepress.dev/reference/site-config
export default defineConfig({
	title: "Workloads",
	base: "/workloads-docs",
	description: "The backend sidecar framework",
	themeConfig: {
		// https://vitepress.dev/reference/default-theme-config
		nav: [
			{ text: "Guide", link: "/guide/why-workloads" },
			{ text: "API Reference", link: "/reference/api/modules" },
		],
		sidebar: {
			"/guide/": {
				base: "/guide/",
				items: [
					{
						text: "Introduction",
						items: [
							{ text: "Why Workloads?", link: "why-workloads" },
							{ text: "Installation", link: "installation" },
							{ text: "Quick Start", link: "quick-start" },
						],
					},
					{
						text: "Workload types",
						items: [
							{ text: "PostgresDatabase", link: "postgres" },
							{ text: "MySqlDatabase", link: "mysql" },
							{ text: "MongoDatabase", link: "mongo-db" },
							{ text: "Bucket", link: "bucket" },
							{ text: "Redis", link: "redis" },
							{ text: "Mailer", link: "mailer" },
							{ text: "ElasticSearch", link: "elastic-search" },
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
							{ text: "build", link: "/cli/build" },
							{ text: "pull", link: "/cli/pull" },
						],
					},
				],
			},
		},
		socialLinks: [
			{ icon: "github", link: "https://github.com/vuejs/vitepress" },
		],
	},
});
