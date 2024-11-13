import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
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
				base: "/guide/",
				items: [
					{
						text: "Introduction",
						collapsed: false,
						items: [
							{
								text: "What is monolayer?",
								link: "introduction/what-is-monolayer",
							},
							{
								text: "Quickstart",
								collapsed: false,
								items: [
									{
										text: "Installation",
										link: "introduction/installation",
									},
									{
										text: "Your first schema",
										link: "introduction/first-schema",
									},
									{
										text: "Querying with Kysely",
										link: "introduction/querying/kysely",
									},
									{
										text: "Querying with Prisma",
										link: "introduction/querying/prisma",
									},
								],
							},
						],
					},
					{
						text: "Configuring monolayer-pg",
						link: "configuration",
					},
					{
						text: "Schema Definition",
						collapsed: false,
						items: [
							{
								text: "Databases",
								link: "schema-definition/databases",
							},
							{
								text: "Schemas",
								link: "schema-definition/schemas",
							},
							{
								text: "Tables",
								link: "schema-definition/tables",
							},
							{
								text: "Columns",
								collapsed: true,
								link: "schema-definition/columns/data-types",
								items: [
									{
										text: "Data Types",
										link: "schema-definition/columns/data-types",
									},
									{
										text: "Default values",
										link: "schema-definition/columns/default-values",
									},
									{
										text: "Identity columns",
										link: "schema-definition/columns/identity-columns",
									},
									{
										text: "Constraints",
										link: "schema-definition/columns/constraints",
									},
									{
										text: "Enumerated Types",
										link: "schema-definition/columns/enumerated-types",
									},
									{
										text: "Other data types",
										link: "schema-definition/columns/other-data-types",
									},
								],
							},
							{
								text: "Constraints",
								collapsed: true,
								link: "schema-definition/constraints/not-null",
								items: [
									{
										text: "Not-null",
										link: "schema-definition/constraints/not-null",
									},
									{
										text: "Primary key",
										link: "schema-definition/constraints/primary-key",
									},
									{
										text: "Foreign keys",
										link: "schema-definition/constraints/foreign-key",
									},
									{
										text: "Unique constraints",
										link: "schema-definition/constraints/unique",
									},
									{
										text: "Check constraints",
										link: "schema-definition/constraints/check",
									},
								],
							},
							{
								text: "Indexes",
								link: "schema-definition/indexes",
							},
							{
								text: "Extensions",
								link: "schema-definition/extensions",
							},
							{
								text: "Triggers",
								link: "schema-definition/triggers",
							},
							{
								text: "Glossary",
								link: "schema-definition/glossary",
							},
						],
					},
					{
						text: "Pushing schema changes",
						link: "pushing-schema-changes",
					},
					{
						text: "Generated types",
						link: "generated-types",
					},
					{ text: "Zod schemas", link: "/zod" },
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
					{
						text: "Command Line Interface",
						collapsed: true,
						items: [
							{
								text: "db create",
								link: "cli/db/create",
							},
							{
								text: "db drop",
								link: "cli/db/drop",
							},
							{
								text: "db reset",
								link: "cli/db/reset",
							},
							{
								text: "db import",
								link: "cli/db/import",
							},
							{
								text: "push dev",
								link: "cli/push/dev",
							},
							{
								text: "push prod",
								link: "cli/push/prod",
							},
							{
								text: "data apply",
								link: "cli/data/apply",
							},
							{
								text: "data up",
								link: "cli/data/up",
							},
							{
								text: "data down",
								link: "cli/data/down",
							},
							{
								text: "data status",
								link: "cli/data/status",
							},
							{
								text: "data scaffold",
								link: "cli/data/scaffold",
							},
							{
								text: "seed up",
								link: "cli/seed/up",
							},
							{
								text: "seed scaffold",
								link: "cli/seed/scaffold",
							},
						],
					},
				],
			},
			"/reference/": {
				base: "/reference/",
				items: [
					{
						text: "Modules",
						items: require("./../reference/api/typedoc-sidebar.json"),
					},
				],
			},
		},
		socialLinks: [
			{ icon: "github", link: "https://github.com/monolayer/monorepo" },
		],
		search: {
			provider: "local",
		},
	},
});
