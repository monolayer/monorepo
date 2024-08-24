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
					text: "Other data types",
					link: "schema-definition/columns/other-data-types",
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
	],
};
