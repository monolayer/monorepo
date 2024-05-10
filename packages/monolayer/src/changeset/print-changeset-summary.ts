import * as p from "@clack/prompts";
import nunjucks from "nunjucks";
import color from "picocolors";
import {
	changesetStats,
	type AddDropStats,
	type SummaryStats,
	type TableStats,
} from "~/changeset/changeset-stats.js";
import { type Changeset } from "~/changeset/types.js";
import {
	ChangeWarningCode,
	type BackwardIncompatibleChange,
	type ChangeWarning,
	type DestructiveChange,
} from "./warnings.js";

type TableRecord = Record<
	string,
	{
		columns: string;
		primaryKeys: string;
		foreignKeys: string;
		uniqueConstraints: string;
		checkConstraints: string;
		indexes: string;
		triggers: string;
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
				triggers: addDropAlterSummary(table.triggers, "triggers"),
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
	p.log.step(color.underline("Change Summary:"));
	p.log.message(render);

	if (anyWarnings(changeset)) {
		p.log.warning(color.yellow("Warnings:"));
		const warnings = changesetWarnings(changeset);
		printBackwardIncompatibleWarnings(warnings.backwardIncompatible);
		printDestructiveWarnings(warnings.destructive);
	}
}

export const summaryTemplate = nunjucks.compile(`
{%- if extensionsSummary !== '' -%}
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
{%- if tableStats.triggers !== '' %}
    {{ tableStats.triggers }}
{%- endif %}
{% endfor %}
{%- endfor -%}
`);

function statCount(
	label: "added" | "dropped" | "changed" | "renamed",
	count: number,
) {
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
	if (stats.renamed > 0) summary.push(statCount("renamed", stats.renamed));
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

function changesetWarnings(changeset: Changeset[]) {
	return changeset
		.flatMap((c) => c.warnings)
		.filter((c): c is ChangeWarning => c !== undefined)
		.reduce(
			(acc, warning) => {
				switch (warning.code) {
					case ChangeWarningCode.TableRename:
					case ChangeWarningCode.ColumnRename:
						acc.backwardIncompatible = [...acc.backwardIncompatible, warning];
						break;
					case ChangeWarningCode.TableDrop:
					case ChangeWarningCode.ColumnDrop:
					case ChangeWarningCode.SchemaDrop:
						acc.destructive = [...acc.destructive, warning];
						break;
				}
				return acc;
			},
			{
				backwardIncompatible: [] as Array<BackwardIncompatibleChange>,
				destructive: [] as Array<DestructiveChange>,
			},
		);
}

function printBackwardIncompatibleWarnings(
	backwardIncompatible: BackwardIncompatibleChange[],
) {
	const messages = [];
	for (const warning of backwardIncompatible) {
		switch (warning.code) {
			case ChangeWarningCode.TableRename:
				messages.push(
					`- Table '${warning.tableRename.from}' has been renamed to '${warning.tableRename.to}' (schema: '${warning.schema}')`,
				);
				break;
			case ChangeWarningCode.ColumnRename:
				messages.push(
					`- Column '${warning.columnRename.from}' has been renamed to '${warning.columnRename.to}' (schema: '${warning.schema}', table: '${warning.table}')`,
				);
				break;
		}
	}
	p.log.warning(`${color.underline("Backward incompatible changes")}

${messages.join("\n")}`);
	p.note(`${color.gray("These changes will prevent existing applications or clients that rely")}
${color.gray("on the old schema from functioning correctly.")}`);
}

function printDestructiveWarnings(destructive: DestructiveChange[]) {
	const messages = [];
	for (const warning of destructive) {
		switch (warning.code) {
			case ChangeWarningCode.SchemaDrop:
				messages.push(`- Schema '${warning.schema}' has been dropped`);
				break;
			case ChangeWarningCode.TableDrop:
				messages.push(
					`- Table '${warning.table}' has been dropped (schema: '${warning.schema}')`,
				);
				break;
			case ChangeWarningCode.ColumnDrop:
				messages.push(
					`- Column '${warning.column}' has been droppped (schema: '${warning.schema}', table: '${warning.table}')`,
				);
				break;
		}
	}
	p.log.warning(`${color.underline("Destructive changes")}

${messages.join("\n")}`);
	p.note(`${color.gray("These changes may result in a data loss and will prevent existing applications or")}
${color.gray("or clients that rely on the old schema from functioning correctly.")}`);
}

function anyWarnings(changeset: Changeset[]) {
	return changeset.some((c) => (c.warnings || []).length > 0);
}
