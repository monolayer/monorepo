import { defineConfig } from "vitepress";
// https://vitepress.dev/reference/site-config
export default defineConfig({
	title: "Workloads",
	description: "The backend sidecar framework",
	themeConfig: {
		// https://vitepress.dev/reference/default-theme-config
		nav: [
			{ text: "Guide", link: "/guide/what-is-workloads" },
			{ text: "API Reference", link: "/reference/api/modules" },
		],
		sidebar: {
			"/guide/": {
				base: "/guide/",
				items: [
					{
						text: "Introduction",
						items: [
							{ text: "What is Workloads?", link: "what-is-workloads" },
							{ text: "Getting Started", link: "getting-started" },
						],
					},
					{
						text: "Developing with Workloads",
						items: [
							{
								text: "Workload types",
								items: [
									{ text: "PostgreSQL", link: "postgres" },
									{ text: "MySQL", link: "mysql" },
									{ text: "MongoDB", link: "mongo-db" },
									{ text: "Redis", link: "redis" },
									{ text: "Mailer", link: "mailer" },
									{ text: "ElasticSearch", link: "elastic-search" },
								],
							},
							{
								text: "Environments",
								collapsed: false,
								items: [
									{ text: "Dev", link: "dev-env" },
									{ text: "Test", link: "test-env" },
									{ text: "Customizing", link: "customizing-environment" },
								],
							},
							{ text: "Testing strategies", link: "testing" },
						],
					},
					{
						text: "Build Output",
						link: "build-output",
					},
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
							{ text: "dev", link: "/cli/dev" },
							{ text: "build", link: "/cli/build" },
							{ text: "container stop", link: "/cli/container-stop" },
							{ text: "container status", link: "/cli/container-status" },
							{ text: "container pull", link: "/cli/container-pull" },
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
