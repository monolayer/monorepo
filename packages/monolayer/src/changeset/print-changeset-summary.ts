/* eslint-disable max-lines */
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
import { type ChangeWarning, type DestructiveChange } from "./warnings.js";
import {
	printAddBigSerialColumn,
	type AddBigSerialColumn,
} from "./warnings/add-bigserial-column.js";
import {
	printAddPrimaryKeyToExistingNullableColumn,
	type AddPrimaryKeyToExistingNullableColumn,
} from "./warnings/add-primary-key-to-existing-nullable-column.js";
import {
	printAddPrimaryKeyToNewColumn,
	type AddPrimaryKeyToNewColumn,
} from "./warnings/add-primary-key-to-new-column.js";
import {
	printAddSerialColumn,
	type AddSerialColumn,
} from "./warnings/add-serial-column.js";
import {
	printChangeColumnDefaultVolatileWarning,
	type AddVolatileDefault,
} from "./warnings/add-volatile-default.js";
import {
	printChangeColumnTypeWarning,
	type ChangeColumnType,
} from "./warnings/change-column-type.js";
import { ChangeWarningCode } from "./warnings/codes.js";
import {
	printColumnRenameWarnings,
	type ColumnRename,
} from "./warnings/column-rename.js";
import {
	printTableRenameWarnings,
	type TableRename,
} from "./warnings/table-rename.js";

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

	const warnings = changesetWarnings(changeset);

	printTableRenameWarnings(warnings.tableRename);
	printColumnRenameWarnings(warnings.columnRename);
	printDestructiveWarnings(warnings.destructive);
	printChangeColumnTypeWarning(warnings.changeColumnType);
	printChangeColumnDefaultVolatileWarning(warnings.changeColumnDefault);
	printAddSerialColumn(warnings.addSerialColumn);
	printAddBigSerialColumn(warnings.addBigSerialColumn);
	printAddPrimaryKeyToExistingNullableColumn(
		warnings.addPrimaryKeyToExistingNullableColumn,
	);
	printAddPrimaryKeyToNewColumn(warnings.addPrimaryKeyToNewNullableColumn);
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

function changesetWarnings(changeset: Changeset[]) {
	return changeset
		.flatMap((c) => c.warnings)
		.filter((c): c is ChangeWarning => c !== undefined)
		.reduce(
			(acc, warning) => {
				switch (warning.code) {
					case ChangeWarningCode.TableRename:
						acc.tableRename = [...acc.tableRename, warning];
						break;
					case ChangeWarningCode.ColumnRename:
						acc.columnRename = [...acc.columnRename, warning];
						break;
					case ChangeWarningCode.TableDrop:
					case ChangeWarningCode.ColumnDrop:
					case ChangeWarningCode.SchemaDrop:
						acc.destructive = [...acc.destructive, warning];
						break;
					case ChangeWarningCode.ChangeColumnType:
						acc.changeColumnType = [...acc.changeColumnType, warning];
						break;
					case ChangeWarningCode.AddVolatileDefault:
						acc.changeColumnDefault = [...acc.changeColumnDefault, warning];
						break;
					case ChangeWarningCode.AddSerialColumn:
						acc.addSerialColumn = [...acc.addSerialColumn, warning];
						break;
					case ChangeWarningCode.AddBigSerialColumn:
						acc.addBigSerialColumn = [...acc.addBigSerialColumn, warning];
						break;
					case ChangeWarningCode.AddPrimaryKeyToExistingNullableColumn:
						acc.addPrimaryKeyToExistingNullableColumn = [
							...acc.addPrimaryKeyToExistingNullableColumn,
							warning,
						];
						break;
					case ChangeWarningCode.AddPrimaryKeyToNewColumn:
						acc.addPrimaryKeyToNewNullableColumn = [
							...acc.addPrimaryKeyToNewNullableColumn,
							warning,
						];
				}
				return acc;
			},
			{
				tableRename: [] as Array<TableRename>,
				columnRename: [] as Array<ColumnRename>,
				destructive: [] as Array<DestructiveChange>,
				changeColumnType: [] as Array<ChangeColumnType>,
				changeColumnDefault: [] as Array<AddVolatileDefault>,
				addSerialColumn: [] as Array<AddSerialColumn>,
				addBigSerialColumn: [] as Array<AddBigSerialColumn>,
				addPrimaryKeyToExistingNullableColumn:
					[] as Array<AddPrimaryKeyToExistingNullableColumn>,
				addPrimaryKeyToNewNullableColumn: [] as Array<AddPrimaryKeyToNewColumn>,
			},
		);
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
	if (messages.length > 0) {
		p.log.warning(
			`${color.yellow("Warning: Destructive changes detected.")}

${messages.join("\n")}`,
		);
		p.log.message(
			color.gray(`These changes may result in a data loss and will prevent existing applications
that rely on the old schema from functioning correctly.`),
		);
	}
}
