import * as p from "@clack/prompts";
import nunjucks from "nunjucks";
import color from "picocolors";
import {
	changesetStats,
	type AddDropStats,
	type SummaryStats,
	type TableStats,
} from "~/changeset/changeset-stats.js";
import type { Changeset } from "~/changeset/types.js";

type TableRecord = Record<
	string,
	{
		columns: string;
		primaryKeys: string;
		foreignKeys: string;
		uniqueConstraints: string;
		checkConstraints: string;
		indexes: string;
	}
>;

type TemplateSchema = Record<
	string,
	{
		enumSummary: string;
		tables: TableRecord;
		tableHeader: Record<string, string>;
	}
>;

export function renderChangesetSummary(changeset: Changeset[]) {
	const stats = changesetStats(changeset);
	const extensionsSummary = addDropSummary(stats.database.extensions);
	const schemasSummary = addDropSummary(stats.database.schemaSummary);
	const schemas = {} as TemplateSchema;
	for (const schemaName in stats.databaseSchemas) {
		const schema = stats.databaseSchemas[schemaName]!;
		const enumSummary = addDropAlterSummary(schema.enumTypes);
		const tables = {} as TableRecord;
		for (const tableName in schema.tables) {
			const table = schema.tables[tableName]!;
			tables[tableName] = {
				columns: addDropAlterSummary(table.columns, "columns"),
				primaryKeys: addDropAlterSummary(table.primaryKeys, "primary keys"),
				foreignKeys: addDropAlterSummary(table.foreignKeys, "foreign keys"),
				uniqueConstraints: addDropAlterSummary(
					table.uniqueConstraints,
					"unique constraints",
				),
				checkConstraints: addDropAlterSummary(
					table.checkConstraints,
					"check constraints",
				),
				indexes: addDropAlterSummary(table.indexes, "indexes"),
			};
		}
		schemas[schemaName] = {
			enumSummary,
			tables,
			tableHeader: {
				...tableHeader(schema.tables),
				...renamedTableHeader(schema.tableNameChanges),
				...addedTableHeader(schema.addedTables),
				...droppedTableHeader(schema.droppedTables),
			},
		};
	}
	return summaryTemplate.render({
		extensionsSummary,
		schemasSummary,
		schemas,
	});
}

export function printChangesetSummary(changeset: Changeset[]) {
	const render = renderChangesetSummary(changeset);
	p.log.success(render);
}

export const summaryTemplate = nunjucks.compile(`Change Summary:

{%- if extensionsSummary !== '' %}
Extensions: {{ extensionsSummary }}
{%- endif %}
{%- if schemasSummary !== '' %}
Schemas: {{ schemasSummary }}
{%- endif %}
{% for schemaName, schemaStats in schemas %}
'{{ schemaName }}' schema:
{% if schemaStats.enumSummary !== '' %}
  Enum Types: {{ schemaStats.enumSummary }}
{% endif -%}

{% for tableName, tableStats in schemaStats.tables %}
  {{ schemaStats.tableHeader[tableName] | safe }}
{%- if tableStats.columns !== '' %}
    {{ tableStats.columns }}
{%- endif -%}
{%- if tableStats.primaryKeys !== '' %}
    {{ tableStats.primaryKeys }}
{%- endif %}
{%- if tableStats.foreignKeys !== '' %}
    {{ tableStats.foreignKeys }}
{%- endif %}
{%- if tableStats.uniqueConstraints !== '' %}
    {{ tableStats.uniqueConstraints }}
{%- endif %}
{%- if tableStats.checkConstraints !== '' %}
    {{ tableStats.checkConstraints }}
{%- endif %}
{%- if tableStats.indexes !== '' %}
    {{ tableStats.indexes }}
{%- endif %}
{% endfor %}
{%- endfor -%}
`);

function statCount(label: "added" | "dropped" | "changed", count: number) {
	const colorfn =
		label === "added"
			? color.green
			: label === "dropped"
				? color.red
				: color.yellow;
	return `${colorfn(label)} (${count})`;
}

function addDropSummary(stats: AddDropStats) {
	const summary = [];
	if (stats.added > 0) summary.push(statCount("added", stats.added));
	if (stats.dropped > 0) summary.push(statCount("dropped", stats.dropped));
	return summary.join(", ");
}

function addDropAlterSummary(stats: SummaryStats, name: string = "none") {
	const summary = [];
	if (stats.added > 0) summary.push(statCount("added", stats.added));
	if (stats.dropped > 0) summary.push(statCount("dropped", stats.dropped));
	if (stats.altered > 0) summary.push(statCount("changed", stats.altered));
	if (summary.length === 0) return "";
	return [name !== "none" ? `${name}: ` : "", summary.join(", ")].join("");
}

function tableHeader(tables: Record<string, TableStats>) {
	return Object.entries(tables).reduce(
		(acc, [name]) => {
			acc[name] = `'${name}' table`;
			return acc;
		},
		{} as Record<string, string>,
	);
}

function renamedTableHeader(tableNameChanges: Record<string, string>) {
	return Object.entries(tableNameChanges).reduce(
		(acc, [newName, oldName]) => {
			acc[newName] =
				`'${newName}' table (${color.yellow("renamed")} from '${oldName}')`;
			return acc;
		},
		{} as Record<string, string>,
	);
}

function addedTableHeader(addedTables: string[]) {
	return addedTables.reduce(
		(acc, addedTable) => {
			acc[addedTable] = `'${addedTable}' table (${color.green("added")})`;
			return acc;
		},
		{} as Record<string, string>,
	);
}

function droppedTableHeader(droppedTables: string[]) {
	return droppedTables.reduce(
		(acc, droppedTable) => {
			acc[droppedTable] = `'${droppedTable}' table (${color.red("dropped")})`;
			return acc;
		},
		{} as Record<string, string>,
	);
}
