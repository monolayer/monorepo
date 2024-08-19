/* eslint-disable complexity */
import type { ColumnInfo } from "@monorepo/pg/schema/column/types.js";
import { camelCase, constantCase, kebabCase } from "case-anything";
import { appendFileSync, readFileSync, writeFileSync } from "fs";
import { default as jscodeshift } from "jscodeshift";
import nunjucks from "nunjucks";
import path from "path";
import { columnDefinition } from "~programs/import-schemas/column-definition.js";

export interface ImportedSchema {
	enums: {
		name: string;
		definition: string;
	}[];
	extensions: string[];
	tables: [
		string,
		{
			columns: Record<string, ColumnInfo>;
			primaryKey: string | undefined;
			foreignKeys: string[];
			uniqueConstraints: string[];
			checkConstraints: string[];
			indexes: string[];
			triggers: string[];
		},
	][];
}

export function createSchema(
	databaseName: string,
	schema: ImportedSchema,
	folder: string,
) {
	const imports: Set<string> = new Set();
	const extensions = schema.extensions;
	imports.add("schema");

	if (schema.extensions.length > 0) {
		imports.add("extension");
	}

	const enums = schema.enums;
	if (enums.length > 0) {
		imports.add("enumType");
	}

	const tables: string[] = [];
	const schemaPath = path.join(folder, `${kebabCase(databaseName)}-schema.ts`);

	for (const [tableName, tableSchema] of schema.tables) {
		imports.add("table");
		const columns = tableSchema.columns;
		const templateColumns: { name: string; definition: string }[] = [];
		const primaryKey = tableSchema?.primaryKey;
		const foreignKeys = tableSchema?.foreignKeys || [];
		const uniqueConstraints = tableSchema?.uniqueConstraints || [];
		const checkConstraints = tableSchema?.checkConstraints || [];
		const indexes = tableSchema?.indexes || [];
		const triggers = tableSchema?.triggers || [];

		for (const [columnName, columnInfo] of Object.entries(columns)) {
			const definition = columnDefinition(columnInfo, enums);
			imports.add(definition.importName);
			templateColumns.push({
				name: columnName,
				definition: definition.code,
			});
		}

		if (primaryKey !== undefined) {
			imports.add("primaryKey");
		}
		if (foreignKeys.length > 0) {
			imports.add("unmanagedForeignKey");
		}
		if (uniqueConstraints.length > 0) {
			imports.add("unique");
		}
		if (checkConstraints.length > 0) {
			imports.add("unmanagedCheck");
		}
		if (indexes.length > 0) {
			imports.add("unmanagedIndex");
		}
		if (triggers.length > 0) {
			imports.add("unmanagedTrigger");
		}

		const templateVars = {
			tableName: tableName,
			columns: templateColumns,
			primaryKey,
			foreignKeys,
			uniqueConstraints,
			checkConstraints,
			indexes,
			triggers,
		};
		tables.push(nunjucks.compile(tableTemplate).render(templateVars));
	}

	const sqlUsed = tables.some((table) => table.includes("sql`"));
	const tableNames = schema.tables.map(([tableName]) => tableName);

	const schemaModuleName = camelCase(`${databaseName}Schema`);
	const schemaModuleExtensionName = camelCase(`${databaseName}Extensions`);
	const configurationName = camelCase(`${databaseName}`);

	writeFileSync(
		schemaPath,
		nunjucks.compile(schemaTemplate).render({
			sqlUsed,
			schemaModuleName,
			schemaModuleExtensionName,
			columnImports: Array.from(imports).sort().join(", "),
			tableNames,
			tables: tables.length > 0 ? tables.join("\n") : undefined,
			extensions,
			enums,
		}),
	);

	const moduleImports = [schemaModuleName, schemaModuleExtensionName].join(
		", ",
	);

	addImportToConfiguration(folder, schemaPath, moduleImports);

	writeConfiguration({
		databaseName,
		folder,
		configurationName,
		schemaModuleName,
		schemaModuleExtensionName,
		envVar: constantCase(configurationName),
	});

	return {
		configuration: {
			name: configurationName,
			path: path.join(folder, `databases.ts`),
		},
		schema: {
			path: schemaPath,
			moduleName: schemaModuleName,
			extensionName: schemaModuleExtensionName,
		},
	};
}

const schemaTemplate = `{%- if sqlUsed %}import { sql } from "kysely"{%- endif %};
import { {{ columnImports | safe }} } from "monolayer/pg";
{%- if extensions.length > 0 %}

export const {{ schemaModuleExtensionName }} = [
	{%- for extension in extensions %}
	{{ extension | safe }},
	{%- endfor %}
];
{%- else %}

export const {{ schemaModuleExtensionName }} = [];
{%- endif %}
{%- if enums.length > 0 %}

const enums = [
{%- for enum in enums %}
  {{ enum.definition | safe}},
{%- endfor %}
];
{%- endif %}
{%- if tables %}

{{ tables | safe }}
{%- endif %}

export const {{ schemaModuleName }} = schema({
	{%- if enums.length > 0 %}
	types: enums,
	{%- endif %}
	tables: {
		{%- for tableName in tableNames %}
		{{ tableName | safe }},
		{%- endfor %}
	},
});

export type DB = typeof {{ schemaModuleName }}.infer;
`;

const tableTemplate = `export const {{ tableName | safe }} = table({
  columns: {
    {%- for column in columns %}
    {{ column.name | safe }}: {{ column.definition | safe }},
    {%- endfor %}
  },
	constraints: {
		{%- if primaryKey %}
		primaryKey: {{ primaryKey | safe }},
		{%- endif %}
		{%- if foreignKeys.length > 0 %}
		foreignKeys: [
      {%- for foreignKey in foreignKeys %}
      {{ foreignKey | safe }},
      {%- endfor %}
    ],
		{%- endif %}
		{%- if uniqueConstraints.length > 0 %}
		unique: [
      {%- for unique in uniqueConstraints %}
      {{ unique | safe }},
      {%- endfor %}
    ],
		{%- endif %}
		{%- if checkConstraints.length > 0 %}
		checks: [
      {%- for check in checkConstraints %}
      {{ check | safe }},
      {%- endfor %}
    ],
		{%- endif %}
	},
	{%- if indexes.length > 0 %}
	indexes: [
		{%- for index in indexes %}
		{{ index | safe }},
		{%- endfor %}
	],
	{%- endif %}
	{%- if triggers.length > 0 %}
	triggers: [
		{%- for trigger in triggers %}
		{{ trigger | safe }},
		{%- endfor %}
	],
	{%- endif %}
});
`;

function writeConfiguration(options: {
	databaseName: string;
	folder: string;
	configurationName: string;
	schemaModuleName: string;
	schemaModuleExtensionName: string;
	envVar: string;
}) {
	const configurationPath = path.join(options.folder, `databases.ts`);
	const content = nunjucks.compile(configurationTemplate).render(options);
	appendFileSync(configurationPath, content);
}

export function addImportToConfiguration(
	folder: string,
	schemaPath: string,
	moduleImports: string,
) {
	const configurationPath = path.join(folder, `databases.ts`);
	const importSchemaPath = path.relative(
		folder,
		schemaPath.substring(0, schemaPath.lastIndexOf(".")),
	);

	const file = {
		path: configurationPath,
		source: readFileSync(configurationPath, "utf8").toString(),
	};

	const j = jscodeshift.withParser("ts");
	const source = j(file.source);
	const importDeclarations = source.find(j.ImportDeclaration);
	const importDeclaration = `import { ${moduleImports} } from "./${importSchemaPath}";`;

	if (importDeclarations.size() > 0) {
		const lastImport = importDeclarations
			.at(importDeclarations.size() - 1)
			.get();
		j(lastImport).insertAfter(importDeclaration);
	} else {
		source.get().node.program.body.unshift(importDeclaration);
	}
	writeFileSync(configurationPath, source.toSource());
}

const configurationTemplate = `

export const {{ configurationName }} = defineDatabase("{{ configurationName }}", {
	schemas: [{{ schemaModuleName }}],
	extensions: {{ schemaModuleExtensionName }},
});
`;
