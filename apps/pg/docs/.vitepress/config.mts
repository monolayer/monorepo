import { apiModules } from ".vitepress/sidebar-items/api-modules.mjs";
import { cli } from ".vitepress/sidebar-items/cli.mjs";
import { introduction } from ".vitepress/sidebar-items/introduction.mjs";
import { schemaDefinition } from ".vitepress/sidebar-items/schema-definition.mjs";
import { withMermaid } from "vitepress-plugin-mermaid";

// https://vitepress.dev/reference/site-config
export default withMermaid({
	title: "monolayer-pg",
	base: "/pg-docs",
	description: "Database schema management for PostgreSQL",
	themeConfig: {
		// https://vitepress.dev/reference/default-theme-config
		nav: [
			{
				text: "Guide",
				link: "/guide/introduction/what-is-monolayer",
				activeMatch: "/guide/",
			},
			{
				text: "API Reference",
				link: "/reference/api/modules",
				activeMatch: "/reference/",
			},
		],

		sidebar: {
			"/guide/": {
				collapsed: false,
				base: "/guide/",
				items: [
					introduction,
					{
						text: "Configuring monolayer-pg",
						link: "configuration",
					},
					schemaDefinition,
					{
						text: "Pushing schema changes",
						link: "pushing-schema-changes",
					},
					{
						text: "Generated types",
						link: "generated-types",
					},
					{
						text: "Data migrations",
						link: "data-migrations",
					},
					{
						text: "Seeding your database",
						link: "seed",
					},
					{
						text: "CamelCase to snake_case",
						link: "recipes/camel-case",
					},
					{
						text: "Multiple databases",
						link: "recipes/multiple-databases",
					},
					{
						text: "Multiple database schemas",
						link: "recipes/multiple-schemas",
					},
					cli,
				],
			},
			"/reference/": apiModules,
		},
		socialLinks: [
			{ icon: "github", link: "https://github.com/dunkelbraun/monolayer" },
		],
		search: {
			provider: "local",
		},
	},
	mermaid: {},
});
