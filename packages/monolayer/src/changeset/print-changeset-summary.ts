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
import {
	ChangeWarningCode,
	type ChangeColumnType,
	type ChangeWarning,
	type ColumnRenameWarning,
	type CreatePrimaryKey,
	type CreateUniqueConstraint,
	type DestructiveChange,
	type TableRenameWarning,
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

	const warnings = changesetWarnings(changeset);

	printTableRenameWarnings(warnings.tableRename);
	printColumnRenameWarnings(warnings.columnRename);
	printDestructiveWarnings(warnings.destructive);
	printCreatePrimaryKeyWarning(warnings.createPrimaryKey);
	printCreateUniqueConstraintWarning(warnings.createUniqueConstraint);
	printChangeColumnTypeWarning(warnings.changeColumnType);
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
					case ChangeWarningCode.CreatePrimaryKey:
						acc.createPrimaryKey = [...acc.createPrimaryKey, warning];
						break;
					case ChangeWarningCode.CreateUniqueConstraint:
						acc.createUniqueConstraint = [
							...acc.createUniqueConstraint,
							warning,
						];
						break;
					case ChangeWarningCode.ChangeColumnType:
						acc.changeColumnType = [...acc.changeColumnType, warning];
						break;
				}
				return acc;
			},
			{
				tableRename: [] as Array<TableRenameWarning>,
				columnRename: [] as Array<ColumnRenameWarning>,
				destructive: [] as Array<DestructiveChange>,
				createPrimaryKey: [] as Array<CreatePrimaryKey>,
				createUniqueConstraint: [] as Array<CreateUniqueConstraint>,
				changeColumnType: [] as Array<ChangeColumnType>,
			},
		);
}

function printTableRenameWarnings(tableRenameWarnings: TableRenameWarning[]) {
	const messages = [];
	for (const warning of tableRenameWarnings) {
		messages.push(
			`- Table '${warning.tableRename.from}' has been renamed to '${warning.tableRename.to}' (schema: '${warning.schema}')`,
		);
	}
	if (messages.length > 0) {
		p.log.warning(
			`${color.yellow("Warning: detected table renames")} (backward incompatible change)

${messages.join("\n")}`,
		);
		p.log.message(
			color.gray(`Renaming a table will disrupt running applications that rely on the old table name.

Downtime for your application can only be avoided by using a safer but complex approach:
 - 1. Create a new table with the new name.
 - 2. Write to both tables (old and new).
 - 3. Backfill data from the old table to the new table.
 - 4. Move reads from the old table to the new table.
 - 5. Stop writing to the old table.
 - 6. Drop the old table.`),
		);
	}
}

function printColumnRenameWarnings(
	columnRenameWarnings: ColumnRenameWarning[],
) {
	const messages = [];
	for (const warning of columnRenameWarnings) {
		messages.push(
			`- Column '${warning.columnRename.from}' has been renamed to '${warning.columnRename.to}' (schema: '${warning.schema}', table: '${warning.table}')`,
		);
	}
	if (messages.length > 0) {
		p.log.warning(
			`${color.yellow("Warning: detected column renames")} (backward incompatible change)

${messages.join("\n")}`,
		);
		p.log.message(
			color.gray(`Renaming a column will disrupt running applications that rely on the old column name.

Downtime for your application can only be avoided by using a safer but complex approach:
  - 1. Create a new column with the new name.
  - 2. Write to both columns (old and new).
  - 3. Backfill data from the old column to the new column.
  - 4. Move reads from the old column to the new column.
  - 5. Stop writing to the old column.
  - 6. Drop the old column.`),
		);
	}
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

function printCreatePrimaryKeyWarning(warnings: CreatePrimaryKey[]) {
	const messages = [];
	for (const warning of warnings) {
		messages.push(
			`- Primary key added to table '${warning.table}' (schema: '${warning.schema}')`,
		);
	}
	if (messages.length > 0) {
		p.log.warning(
			`${color.yellow("Warning: Blocking changes detected.")}

${messages.join("\n")}`,
		);
		p.log.message(
			color.gray(`Creating a primary key acquires an ACCESS EXCLUSIVE lock on the table. This lock will prevent
any other transactions from reading or writing to the table until the primary key is created.`),
		);
	}
}

function printCreateUniqueConstraintWarning(
	warnings: CreateUniqueConstraint[],
) {
	const messages = [];
	for (const warning of warnings) {
		if (warning.columns.length === 1) {
			messages.push(
				`- Unique contraint added to column '${warning.columns.join("")}' on table '${warning.table}' (schema: '${warning.schema}')`,
			);
		} else {
			const columns = warning.columns.map((column) => `'${column}'`).join(", ");
			messages.push(
				`- Unique contraint added to columns ${columns} on table '${warning.table}' (schema: '${warning.schema}')`,
			);
		}
	}
	if (messages.length > 0) {
		p.log.warning(
			`${color.yellow("Warning: Blocking changes detected.")}

${messages.join("\n")}`,
		);
		p.log.message(
			color.gray(`Creating a unique constraint acquires an ACCESS EXCLUSIVE lock on the table. This lock will prevent
any other transactions from reading or writing to the table until the unique constraint is created.`),
		);
	}
}

function printChangeColumnTypeWarning(warnings: ChangeColumnType[]) {
	const messages = [];
	for (const warning of warnings) {
		messages.push(
			`- Changed column '${warning.column}' data type from '${warning.from}' to '${warning.to}' (table: '${warning.table}' schema: '${warning.schema}')`,
		);
	}
	if (messages.length > 0) {
		p.log.warning(
			`${color.yellow("Warning: Blocking changes detected.")}

${messages.join("\n")}`,
		);
		p.log.message(
			color.gray(`The column data type change will cause the entire table and indexes on changed columns to be rewritten
Other transactions will not be able to read and write to the table until the rewrite is finished.

Downtime for your application can only be avoided by using a safer but complex approach:
  - 1. Create a new column with the new name.
  - 2. Write to both columns (old and new).
  - 3. Backfill data from the old column to the new column.
  - 4. Move reads from the old column to the new column.
  - 5. Stop writing to the old column.
  - 6. Drop the old column.`),
		);
	}
}
