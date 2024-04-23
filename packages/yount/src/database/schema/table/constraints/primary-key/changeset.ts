/* eslint-disable max-lines */
import type { Difference } from "microdiff";
import type { GeneratorContext } from "~/changeset/schema-changeset.js";
import {
	ChangeSetType,
	MigrationOpPriority,
	type Changeset,
} from "~/changeset/types.js";
import { currentColumName } from "~/introspection/column-name.js";
import { executeKyselySchemaStatement } from "../../../../../changeset/helpers.js";
import type { LocalTableInfo } from "../../../../../introspection/introspection.js";
import {
	columnNameKey,
	extractColumnsFromPrimaryKey,
	findColumnByNameInTable,
} from "../../../../../migrations/migration-schema.js";

export function primaryKeyMigrationOpGenerator(
	diff: Difference,
	context: GeneratorContext,
) {
	if (isPrimaryKeyCreate(diff)) {
		return createPrimaryKeyMigration(diff, context);
	}
	if (isPrimaryKeyDrop(diff)) {
		return dropPrimaryKeyMigration(diff, context);
	}
	if (isPrimaryKeyChange(diff, context)) {
		return changePrimaryKeyMigration(diff, context);
	}
}

type PrimaryKeyCreate = {
	type: "CREATE";
	path: ["primaryKey", string];
	value: {
		[key: string]: string;
	};
};

type PrimaryKeyDropDiff = {
	type: "REMOVE";
	path: ["primaryKey", string];
	oldValue: {
		[key: string]: string;
	};
};

type PrimaryKeyChangeDiff = {
	type: "CHANGE";
	path: ["primaryKey", string, string];
	value: string;
	oldValue: string;
};

function isPrimaryKeyCreate(test: Difference): test is PrimaryKeyCreate {
	return (
		test.type === "CREATE" &&
		test.path.length === 2 &&
		test.path[0] === "primaryKey" &&
		typeof test.path[1] === "string" &&
		typeof test.value === "object" &&
		Object.keys(test.value).length === 1
	);
}

function isPrimaryKeyDrop(test: Difference): test is PrimaryKeyDropDiff {
	return (
		test.type === "REMOVE" &&
		test.path.length === 2 &&
		test.path[0] === "primaryKey" &&
		typeof test.path[1] === "string" &&
		typeof test.oldValue === "object" &&
		Object.keys(test.oldValue).length === 1
	);
}

function isPrimaryKeyChange(
	test: Difference,
	context: GeneratorContext,
): test is PrimaryKeyChangeDiff {
	if (
		test.type === "CHANGE" &&
		test.path.length === 3 &&
		test.path[0] === "primaryKey" &&
		typeof test.path[1] === "string" &&
		typeof test.path[2] === "string" &&
		typeof test.value === "string" &&
		typeof test.oldValue === "string"
	) {
		return (
			true &&
			primaryKeyColumnsChange(context, test.path[1], test.value, test.oldValue)
		);
	}

	return false;
}

export function primaryKeyColumnsChange(
	{ local, columnsToRename }: GeneratorContext,
	tableName: string,
	value: string,
	oldValue: string,
) {
	const tb = local.table[tableName]!;
	const oldColumns = extractColumnsFromPrimaryKey(oldValue)
		.map((val) => currentColumName(tableName, val, columnsToRename))
		.sort();

	const newColumns = extractColumnsFromPrimaryKey(value)
		.map((val) => currentColumName(tableName, val, columnsToRename))
		.map((val) => columnNameKey(tb, val))
		.filter((x) => x !== undefined)
		.sort();

	return (
		newColumns.length !== oldColumns.length ||
		!newColumns.every((col, i) => col === oldColumns[i])
	);
}

function createPrimaryKeyMigration(
	diff: PrimaryKeyCreate,
	{ schemaName, addedTables, local }: GeneratorContext,
): Changeset {
	const tableName = diff.path[1];
	const primaryKeyName = Object.keys(diff.value)[0] as keyof typeof diff.value;
	const primaryKeyValue = diff.value[
		primaryKeyName
	] as (typeof diff.value)[keyof typeof diff.value];

	const changeset: Changeset = {
		priority: MigrationOpPriority.PrimaryKeyCreate,
		schemaName,
		tableName: tableName,
		type: ChangeSetType.CreatePrimaryKey,
		up: [
			addPrimaryKeyOp(
				tableName,
				primaryKeyName as string,
				primaryKeyValue,
				schemaName,
			),
		],
		down: addedTables.includes(tableName)
			? [[]]
			: dropPrimaryKeyOp(
					tableName,
					primaryKeyName as string,
					primaryKeyValue,
					local,
					schemaName,
				),
	};
	return changeset;
}

function dropPrimaryKeyMigration(
	diff: PrimaryKeyDropDiff,
	{ schemaName, droppedTables, local }: GeneratorContext,
): Changeset {
	const tableName = diff.path[1];
	const primaryKeyName = Object.keys(
		diff.oldValue,
	)[0] as keyof typeof diff.oldValue;
	const primaryKeyValue = diff.oldValue[
		primaryKeyName
	] as (typeof diff.oldValue)[keyof typeof diff.oldValue];

	const changeset: Changeset = {
		priority: MigrationOpPriority.PrimaryKeyDrop,
		schemaName,
		tableName: tableName,
		type: ChangeSetType.DropPrimaryKey,
		up: droppedTables.includes(tableName)
			? [[]]
			: dropPrimaryKeyOp(
					tableName,
					primaryKeyName as string,
					primaryKeyValue,
					local,
					schemaName,
				),
		down: [
			addPrimaryKeyOp(
				tableName,
				primaryKeyName as string,
				primaryKeyValue,
				schemaName,
			),
		],
	};
	return changeset;
}

function changePrimaryKeyMigration(
	diff: PrimaryKeyChangeDiff,
	{ schemaName, local }: GeneratorContext,
) {
	const tableName = diff.path[1];
	const primaryKeyName = diff.path[2];

	const createChangeset: Changeset = {
		priority: MigrationOpPriority.PrimaryKeyCreate,
		schemaName,
		tableName: tableName,
		type: ChangeSetType.CreatePrimaryKey,
		up: [
			addPrimaryKeyOp(
				tableName,
				primaryKeyName as string,
				diff.value,
				schemaName,
			),
		],
		down: dropPrimaryKeyOp(
			tableName,
			primaryKeyName as string,
			diff.value,
			local,
			schemaName,
		),
	};

	const dropChangeset: Changeset = {
		priority: MigrationOpPriority.PrimaryKeyDrop,
		schemaName,
		tableName: tableName,
		type: ChangeSetType.DropPrimaryKey,
		up: dropPrimaryKeyOp(
			tableName,
			primaryKeyName,
			diff.oldValue,
			local,
			schemaName,
		),
		down: [
			addPrimaryKeyOp(tableName, primaryKeyName, diff.oldValue, schemaName),
		],
	};
	return [createChangeset, dropChangeset];
}

function dropNotNullStatements(
	primaryKeyValue: string,
	tableName: string,
	local: LocalTableInfo,
	schemaName: string,
) {
	const primaryKeyColumns = extractColumnsFromPrimaryKey(primaryKeyValue);
	const dropNotNullStatements = [];
	if (primaryKeyColumns !== null && primaryKeyColumns !== undefined) {
		for (const column of primaryKeyColumns) {
			const table = local.table[tableName];
			if (table !== undefined) {
				const tableColumn =
					table.columns[column] || findColumnByNameInTable(table, column);
				if (tableColumn !== undefined) {
					if (tableColumn.originalIsNullable === undefined) {
						if (tableColumn.isNullable) {
							dropNotNullStatements.push(
								executeKyselySchemaStatement(
									schemaName,
									`alterTable("${tableName}")`,
									`alterColumn("${column}", (col) => col.dropNotNull())`,
								),
							);
						}
					} else {
						if (tableColumn.originalIsNullable !== tableColumn.isNullable) {
							dropNotNullStatements.push(
								executeKyselySchemaStatement(
									schemaName,
									`alterTable("${tableName}")`,
									`alterColumn("${column}", (col) => col.dropNotNull())`,
								),
							);
						}
					}
				}
			} else {
				dropNotNullStatements.push(
					executeKyselySchemaStatement(
						schemaName,
						`alterTable("${tableName}")`,
						`alterColumn("${column}", (col) => col.dropNotNull())`,
					),
				);
			}
		}
	}
	return dropNotNullStatements;
}

function addPrimaryKeyOp(
	tableName: string,
	primaryKeyName: string,
	primaryKeyValue: string,
	schemaName: string,
): string[] {
	return executeKyselySchemaStatement(
		schemaName,
		`alterTable("${tableName}")`,
		`addPrimaryKeyConstraint("${primaryKeyName}", [${extractColumnsFromPrimaryKey(
			primaryKeyValue,
		)
			.map((col) => `"${col}"`)
			.join(", ")}])`,
	);
}

function dropPrimaryKeyOp(
	tableName: string,
	primaryKeyName: string,
	primaryKeyValue: string,
	local: LocalTableInfo,
	schemaName: string,
): string[][] {
	return [
		executeKyselySchemaStatement(
			schemaName,
			`alterTable("${tableName}")`,
			`dropConstraint("${primaryKeyName}")`,
		),
		...dropNotNullStatements(primaryKeyValue, tableName, local, schemaName),
	];
}
