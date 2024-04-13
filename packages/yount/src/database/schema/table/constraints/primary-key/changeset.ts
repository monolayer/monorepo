/* eslint-disable max-lines */
import type { Difference } from "microdiff";
import {
	ChangeSetType,
	MigrationOpPriority,
	type Changeset,
} from "~/changeset/types.js";
import { executeKyselySchemaStatement } from "../../../../../changeset/helpers.js";
import type {
	DbTableInfo,
	LocalTableInfo,
} from "../../../../../introspection/introspection.js";
import {
	extractColumnsFromPrimaryKey,
	findColumnByNameInTable,
} from "../../../../../migrations/migration-schema.js";

export function primaryKeyMigrationOpGenerator(
	diff: Difference,
	addedTables: string[],
	droppedTables: string[],
	local: LocalTableInfo,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	_db: DbTableInfo,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	schemaName: string,
) {
	if (isPrimaryKeyCreateFirst(diff)) {
		return createPrimaryKeyMigration(diff, addedTables, local, schemaName);
	}
	if (isPrimaryKeyDrop(diff)) {
		return dropPrimaryKeyMigration(diff, droppedTables, local, schemaName);
	}
	if (isPrimaryKeyUpdate(diff)) {
		return updatePrimaryKeyMigration(
			diff,
			addedTables,
			droppedTables,
			local,
			schemaName,
		);
	}
	if (isPrimaryKeyReplace(diff)) {
		return replacePrimaryKeyMigration(
			diff,
			addedTables,
			droppedTables,
			local,
			schemaName,
		);
	}
}

type PrimaryKeyCreateFirstDiff = {
	type: "CREATE";
	path: ["primaryKey", string];
	value: {
		[key: string]: string;
	};
};

type PrimaryKeyUpdateDiff = {
	type: "CREATE";
	path: ["primaryKey", string, string];
	value: string;
};

type PrimaryKeyDropDiff = {
	type: "REMOVE";
	path: ["primaryKey", string];
	oldValue: {
		[key: string]: string;
	};
};

type PrimaryKeyReplaceDiff = {
	type: "REMOVE";
	path: ["primaryKey", string, string];
	oldValue: string;
};

function isPrimaryKeyCreateFirst(
	test: Difference,
): test is PrimaryKeyCreateFirstDiff {
	return (
		test.type === "CREATE" &&
		test.path.length === 2 &&
		test.path[0] === "primaryKey" &&
		typeof test.path[1] === "string" &&
		typeof test.value === "object" &&
		Object.keys(test.value).length === 1
	);
}

function isPrimaryKeyUpdate(test: Difference): test is PrimaryKeyUpdateDiff {
	return (
		test.type === "CREATE" &&
		test.path.length === 3 &&
		test.path[0] === "primaryKey" &&
		typeof test.path[1] === "string" &&
		typeof test.path[2] === "string" &&
		typeof test.value === "string"
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

function isPrimaryKeyReplace(test: Difference): test is PrimaryKeyReplaceDiff {
	return (
		test.type === "REMOVE" &&
		test.path.length === 3 &&
		test.path[0] === "primaryKey" &&
		typeof test.path[1] === "string" &&
		typeof test.path[2] === "string" &&
		typeof test.oldValue === "string"
	);
}

function createPrimaryKeyMigration(
	diff: PrimaryKeyCreateFirstDiff,
	addedTables: string[],
	local: LocalTableInfo,
	schemaName: string,
): Changeset {
	const tableName = diff.path[1];
	const primaryKeyName = Object.keys(diff.value)[0] as keyof typeof diff.value;
	const primaryKeyValue = diff.value[
		primaryKeyName
	] as (typeof diff.value)[keyof typeof diff.value];

	const changeset: Changeset = {
		priority: MigrationOpPriority.PrimaryKeyCreate,
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
	droppedTables: string[],
	local: LocalTableInfo,
	schemaName: string,
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

function updatePrimaryKeyMigration(
	diff: PrimaryKeyUpdateDiff,
	addedTables: string[],
	droppedTables: string[],
	local: LocalTableInfo,
	schemaName: string,
): Changeset {
	const tableName = diff.path[1];
	const primaryKeyName = diff.path[2];
	const primaryKeyValue = diff.value;

	const changeset: Changeset = {
		priority: MigrationOpPriority.PrimaryKeyCreate,
		tableName: tableName,
		type: ChangeSetType.CreatePrimaryKey,
		up: droppedTables.includes(tableName)
			? [[]]
			: [
					addPrimaryKeyOp(
						tableName,
						primaryKeyName,
						primaryKeyValue,
						schemaName,
					),
				],
		down: addedTables.includes(tableName)
			? [[]]
			: dropPrimaryKeyOp(
					tableName,
					primaryKeyName,
					primaryKeyValue,
					local,
					schemaName,
				),
	};
	return changeset;
}

function replacePrimaryKeyMigration(
	diff: PrimaryKeyReplaceDiff,
	addedTables: string[],
	droppedTables: string[],
	local: LocalTableInfo,
	schemaName: string,
): Changeset {
	const tableName = diff.path[1];
	const primaryKeyName = diff.path[2];
	const primaryKeyValue = diff.oldValue;

	const changeset: Changeset = {
		priority: MigrationOpPriority.PrimaryKeyDrop,
		tableName: tableName,
		type: ChangeSetType.DropPrimaryKey,
		up: droppedTables.includes(tableName)
			? [[]]
			: dropPrimaryKeyOp(
					tableName,
					primaryKeyName,
					primaryKeyValue,
					local,
					schemaName,
				),
		down: addedTables.includes(tableName)
			? [[]]
			: [
					addPrimaryKeyOp(
						tableName,
						primaryKeyName,
						primaryKeyValue,
						schemaName,
					),
				],
	};
	return changeset;
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
