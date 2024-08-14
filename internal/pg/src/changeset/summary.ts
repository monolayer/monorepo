import * as p from "@clack/prompts";
import nunjucks from "nunjucks";
import color from "picocolors";
import {
	changesetStats,
	type AddDropStats,
	type SummaryStats,
	type TableStats,
} from "~pg/changeset/stats.js";
import type { Changeset } from "~pg/changeset/types.js";
import { printAddBigSerialColumn } from "~pg/changeset/warnings/add-bigserial-column.js";
import { printAddNonNullableColumnWarning } from "~pg/changeset/warnings/add-non-nullable-column.js";
import { printAddPrimaryKeyToExistingNullableColumn } from "~pg/changeset/warnings/add-primary-key-to-existing-nullable-column.js";
import { printAddPrimaryKeyToNewColumn } from "~pg/changeset/warnings/add-primary-key-to-new-column.js";
import { printAddSerialColumn } from "~pg/changeset/warnings/add-serial-column.js";
import { printAddUniqueToExisitingColumnWarning } from "~pg/changeset/warnings/add-unique.js";
import { printChangeColumnDefaultVolatileWarning } from "~pg/changeset/warnings/add-volatile-default.js";
import { printChangeColumnToNonNullableWarning } from "~pg/changeset/warnings/change-column-to-non-nullable.js";
import { printChangeColumnTypeWarning } from "~pg/changeset/warnings/change-column-type.js";
import { ChangeWarningCode } from "~pg/changeset/warnings/codes.js";
import { printColumnRenameWarnings } from "~pg/changeset/warnings/column-rename.js";
import { printWarning } from "~pg/changeset/warnings/print.js";
import { printTableRenameWarnings } from "~pg/changeset/warnings/table-rename.js";
import {
	classifyWarnings,
	type ChangeWarning,
	type DestructiveChange,
} from "~pg/changeset/warnings/warnings.js";

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
	p.log.info(color.underline("Change Summary:"));
	p.log.message(render);

	printWarnigns(
		changeset
			.flatMap((c) => c.warnings)
			.filter((c): c is ChangeWarning => c !== undefined),
	);
}

export function printWarnigns(warnings: ChangeWarning[]) {
	const warningsByCode = classifyWarnings(warnings);
	printTableRenameWarnings(warningsByCode.tableRename);
	printColumnRenameWarnings(warningsByCode.columnRename);
	printDestructiveWarnings(warningsByCode.destructive);
	printChangeColumnTypeWarning(warningsByCode.changeColumnType);
	printChangeColumnDefaultVolatileWarning(warningsByCode.changeColumnDefault);
	printAddSerialColumn(warningsByCode.addSerialColumn);
	printAddBigSerialColumn(warningsByCode.addBigSerialColumn);
	printAddPrimaryKeyToExistingNullableColumn(
		warningsByCode.addPrimaryKeyToExistingNullableColumn,
	);
	printAddPrimaryKeyToNewColumn(
		warningsByCode.addPrimaryKeyToNewNullableColumn,
	);
	printAddUniqueToExisitingColumnWarning(
		warningsByCode.addUniqueToExistingColumn,
	);
	printAddNonNullableColumnWarning(warningsByCode.addNonNullableColumn);
	printChangeColumnToNonNullableWarning(
		warningsByCode.changeColumnToNonNullable,
	);
}
export const summaryTemplate = nunjucks.compile(`
{%- if extensionsSummary !== '' -%}
Extensions: {{ extensionsSummary }}
{%- endif %}
{%- if schemasSummary !== '' %}
Schemas: {{ schemasSummary }}
{%- endif %}
{%- for schemaName, schemaStats in schemas %}

'{{ schemaName }}' schema:
{% if schemaStats.enumSummary !== '' %}
  Enum Types: {{ schemaStats.enumSummary }}
{%- endif %}

{%- for tableName, tableStats in schemaStats.tables %}

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
{%- endfor %}
{%- endfor %}
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
	return Object.entries(tables).reduce<Record<string, string>>(
		(acc, [name]) => {
			acc[name] = `'${name}' table`;
			return acc;
		},
		{},
	);
}

function renamedTableHeader(tableNameChanges: Record<string, string>) {
	return Object.entries(tableNameChanges).reduce<Record<string, string>>(
		(acc, [newName, oldName]) => {
			acc[newName] =
				`'${newName}' table (${color.yellow("renamed")} from '${oldName}')`;
			return acc;
		},
		{},
	);
}

function addedTableHeader(addedTables: string[]) {
	return addedTables.reduce<Record<string, string>>((acc, addedTable) => {
		acc[addedTable] = `'${addedTable}' table (${color.green("added")})`;
		return acc;
	}, {});
}

function droppedTableHeader(droppedTables: string[]) {
	return droppedTables.reduce<Record<string, string>>((acc, droppedTable) => {
		acc[droppedTable] = `'${droppedTable}' table (${color.red("dropped")})`;
		return acc;
	}, {});
}

function printDestructiveWarnings(warnings: DestructiveChange[]) {
	if (warnings.length === 0) return;
	printWarning({
		header: "Destructive changes detected",
		details: warnings.map((warning) => {
			switch (warning.code) {
				case ChangeWarningCode.SchemaDrop:
				case `${ChangeWarningCode.SchemaDrop}`:
					return `- Dropped schema '${color.underline(warning.schema)}'`;
				case ChangeWarningCode.TableDrop:
				case `${ChangeWarningCode.TableDrop}`:
					return `- Dropped table '${color.underline(warning.table)}' ${color.gray(`(schema: '${warning.schema}')`)}`;
				case ChangeWarningCode.ColumnDrop:
				case `${ChangeWarningCode.ColumnDrop}`:
					return `- Dropped column '${color.underline(warning.column)}' ${color.gray(`(table: '${warning.table}' schema: '${warning.schema}')`)}`;
			}
		}),
		notes: [
			"These changes may result in a data loss and will prevent existing applications",
			"that rely on the dropped objects from functioning correctly.",
		],
	});
}
