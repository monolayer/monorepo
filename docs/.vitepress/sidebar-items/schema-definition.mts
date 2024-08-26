export const schemaDefinition = {
	text: "Schema Definition",
	collapsed: true,
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
};
