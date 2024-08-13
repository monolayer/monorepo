import { withMermaid } from "vitepress-plugin-mermaid";
import typedocSidebar from "../reference/api/typedoc-sidebar.json";

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
			"/guide/": {
				base: "/guide/",
				items: [
					{ text: "Introduction", link: "/intro" },
					{ text: "Getting Started", link: "/getting-started" },
					{
						text: "Schema Definition",
						collapsed: true,
						items: [
							{ text: "Overview", link: "/schema-definition/overview" },
							{
								text: "Adding Tables",
								link: "/schema-definition/adding-tables",
							},
							{ text: "Columns", link: "/schema-definition/column-data-types" },
							{
								text: "Enum types",
								link: "/schema-definition/enumerated-types",
							},
							{ text: "Indexes", link: "/schema-definition/indexes" },
							{
								text: "Constraints",
								items: [
									{
										text: "Intro",
										link: "/schema-definition/constraints/intro",
									},
									{
										text: "Not Null",
										link: "/schema-definition/constraints/not-null",
									},
									{
										text: "Primary Key",
										link: "/schema-definition/constraints/primary-key",
									},
									{
										text: "Foreign Key",
										link: "/schema-definition/constraints/foreign-key",
									},
									{
										text: "Unique constraint",
										link: "/schema-definition/constraints/unique",
									},
									{
										text: "Check constraint",
										link: "/schema-definition/constraints/check",
									},
								],
							},

							{ text: "Triggers", link: "/schema-definition/triggers" },
							{
								text: "Extensions",
								link: "/schema-definition/postgresql-extensions",
							},
						],
					},
					{
						text: "Migration System",
						collapsed: true,
						items: [
							{ text: "Generated types", link: "/generated-types" },
							{ text: "Validations with Zod", link: "/validations-with-zod" },
						],
					},
					{
						text: "Types and Validations",
						collapsed: true,
						items: [
							{ text: "Generated types", link: "/generated-types" },
							{ text: "Validations with Zod", link: "/validations-with-zod" },
						],
					},
					{
						text: "Workflows",
						collapsed: true,
						items: [{ text: "Evolving the schema", link: "/evolving-schema" }],
					},
				],
			},
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
