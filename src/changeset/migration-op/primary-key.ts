import type { Difference } from "microdiff";
import type {
	DbTableInfo,
	LocalTableInfo,
} from "../../introspection/schemas.js";
import {
	extractColumnsFromPrimaryKey,
	findColumnByNameInTable,
} from "../../migrations/migration-schema.js";
import { ChangeSetType, type Changeset } from "./changeset.js";
import { executeKyselySchemaStatement } from "./helpers.js";
import { MigrationOpPriority } from "./priority.js";

export function primaryKeyMigrationOpGenerator(
	diff: Difference,
	addedTables: string[],
	droppedTables: string[],
	local: LocalTableInfo,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	_db: DbTableInfo,
) {
	if (isPrimaryKeyCreateFirst(diff)) {
		return createPrimaryKeyMigration(diff, addedTables, local);
	}
	if (isPrimaryKeyDrop(diff)) {
		return dropPrimaryKeyMigration(diff, droppedTables, local);
	}
	if (isPrimaryKeyUpdate(diff)) {
		return updatePrimaryKeyMigration(diff, addedTables, droppedTables, local);
	}
	if (isPrimaryKeyReplace(diff)) {
		return replacePrimaryKeyMigration(diff, addedTables, droppedTables, local);
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
		up: [addPrimaryKeyOp(tableName, primaryKeyName as string, primaryKeyValue)],
		down: addedTables.includes(tableName)
			? [[]]
			: dropPrimaryKeyOp(
					tableName,
					primaryKeyName as string,
					primaryKeyValue,
					local,
				),
	};
	return changeset;
}

function dropPrimaryKeyMigration(
	diff: PrimaryKeyDropDiff,
	droppedTables: string[],
	local: LocalTableInfo,
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
				),
		down: [
			addPrimaryKeyOp(tableName, primaryKeyName as string, primaryKeyValue),
		],
	};
	return changeset;
}

function updatePrimaryKeyMigration(
	diff: PrimaryKeyUpdateDiff,
	addedTables: string[],
	droppedTables: string[],
	local: LocalTableInfo,
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
			: [addPrimaryKeyOp(tableName, primaryKeyName, primaryKeyValue)],
		down: addedTables.includes(tableName)
			? [[]]
			: dropPrimaryKeyOp(tableName, primaryKeyName, primaryKeyValue, local),
	};
	return changeset;
}

function replacePrimaryKeyMigration(
	diff: PrimaryKeyReplaceDiff,
	addedTables: string[],
	droppedTables: string[],
	local: LocalTableInfo,
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
			: dropPrimaryKeyOp(tableName, primaryKeyName, primaryKeyValue, local),
		down: addedTables.includes(tableName)
			? [[]]
			: [addPrimaryKeyOp(tableName, primaryKeyName, primaryKeyValue)],
	};
	return changeset;
}

function dropNotNullStatements(
	primaryKeyValue: string,
	tableName: string,
	local: LocalTableInfo,
) {
	const primaryKeyColumns = extractColumnsFromPrimaryKey(primaryKeyValue);
	const dropNotNullStatements = [];
	if (primaryKeyColumns !== null && primaryKeyColumns !== undefined) {
		for (const column of primaryKeyColumns) {
			const table = local.table[tableName];
			if (table !== undefined) {
				const tableColumn =
					table[column] || findColumnByNameInTable(table, column);
				if (tableColumn !== undefined) {
					if (tableColumn.originalIsNullable === undefined) {
						if (tableColumn.isNullable) {
							dropNotNullStatements.push(
								executeKyselySchemaStatement(
									`alterTable("${tableName}")`,
									`alterColumn("${column}", (col) => col.dropNotNull())`,
								),
							);
						}
					} else {
						if (tableColumn.originalIsNullable !== tableColumn.isNullable) {
							dropNotNullStatements.push(
								executeKyselySchemaStatement(
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
): string[] {
	return executeKyselySchemaStatement(
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
): string[][] {
	return [
		executeKyselySchemaStatement(
			`alterTable("${tableName}")`,
			`dropConstraint("${primaryKeyName}")`,
		),
		...dropNotNullStatements(primaryKeyValue, tableName, local),
	];
}
