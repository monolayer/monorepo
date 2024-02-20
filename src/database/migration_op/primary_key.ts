import type { Difference } from "microdiff";
import type { DbTableInfo, LocalTableInfo } from "../introspection/types.js";
import { extractColumnsFromPrimaryKey } from "../migrations/migration_schema.js";
import { ChangeSetType, type Changeset } from "./changeset.js";
import { executeKyselyDbStatement } from "./helpers.js";
import { MigrationOpPriority } from "./priority.js";

export function primaryKeyMigrationOpGenerator(
	diff: Difference,
	addedTables: string[],
	droppedTables: string[],
	local: LocalTableInfo,
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

	return {
		priority: MigrationOpPriority.PrimaryKeyCreate,
		tableName: tableName,
		type: ChangeSetType.CreatePrimaryKey,
		up: executeKyselyDbStatement(
			`ALTER TABLE ${tableName} ADD CONSTRAINT ${primaryKeyValue}`,
		),
		down: addedTables.includes(tableName)
			? []
			: executeKyselyDbStatement(
					`ALTER TABLE ${tableName} DROP CONSTRAINT ${primaryKeyName}${dropNotNullStatements(
						primaryKeyValue,
						tableName,
						local,
					)}`,
			  ),
	};
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

	return {
		priority: MigrationOpPriority.PrimaryKeyDrop,
		tableName: tableName,
		type: ChangeSetType.DropPrimaryKey,
		up: droppedTables.includes(tableName)
			? []
			: executeKyselyDbStatement(
					`ALTER TABLE ${tableName} DROP CONSTRAINT ${primaryKeyName}${dropNotNullStatements(
						primaryKeyValue,
						tableName,
						local,
					)}`,
			  ),
		down: executeKyselyDbStatement(
			`ALTER TABLE ${tableName} ADD CONSTRAINT ${primaryKeyValue}`,
		),
	};
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

	return {
		priority: MigrationOpPriority.PrimaryKeyCreate,
		tableName: tableName,
		type: ChangeSetType.CreatePrimaryKey,
		up: droppedTables.includes(tableName)
			? []
			: executeKyselyDbStatement(
					`ALTER TABLE ${tableName} ADD CONSTRAINT ${primaryKeyValue}`,
			  ),
		down: addedTables.includes(tableName)
			? []
			: executeKyselyDbStatement(
					`ALTER TABLE ${tableName} DROP CONSTRAINT ${primaryKeyName}${dropNotNullStatements(
						primaryKeyValue,
						tableName,
						local,
					)}`,
			  ),
	};
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

	return {
		priority: MigrationOpPriority.PrimaryKeyDrop,
		tableName: tableName,
		type: ChangeSetType.DropPrimaryKey,
		up: droppedTables.includes(tableName)
			? []
			: executeKyselyDbStatement(
					`ALTER TABLE ${tableName} DROP CONSTRAINT ${primaryKeyName}${dropNotNullStatements(
						primaryKeyValue,
						tableName,
						local,
					)}`,
			  ),
		down: addedTables.includes(tableName)
			? []
			: executeKyselyDbStatement(
					`ALTER TABLE ${tableName} ADD CONSTRAINT ${primaryKeyValue}`,
			  ),
	};
}

export function primaryKeyMigrationOps(
	diff: Difference[],
	addedTables: string[],
	droppedTables: string[],
	local: LocalTableInfo,
) {
	if (diff.length === 0) {
		return [];
	}
	return diff.flatMap((d) => {
		if (isPrimaryKeyCreateFirst(d)) {
			return createPrimaryKeyMigration(d, addedTables, local);
		}
		if (isPrimaryKeyDrop(d)) {
			return dropPrimaryKeyMigration(d, droppedTables, local);
		}
		if (isPrimaryKeyUpdate(d)) {
			return updatePrimaryKeyMigration(d, addedTables, droppedTables, local);
		}
		if (isPrimaryKeyReplace(d)) {
			return replacePrimaryKeyMigration(d, addedTables, droppedTables, local);
		}
		return [];
	});
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
				const tableColumn = table[column];
				if (tableColumn !== undefined) {
					if (tableColumn.originalIsNullable === undefined) {
						if (tableColumn.isNullable) {
							dropNotNullStatements.push(
								`ALTER COLUMN "${column}" DROP NOT NULL`,
							);
						}
					} else {
						if (tableColumn.originalIsNullable !== tableColumn.isNullable) {
							dropNotNullStatements.push(
								`ALTER COLUMN "${column}" DROP NOT NULL`,
							);
						}
					}
				}
			} else {
				dropNotNullStatements.push(`ALTER COLUMN "${column}" DROP NOT NULL`);
			}
		}
	}
	const dropStatements =
		dropNotNullStatements.length > 0
			? `, ${dropNotNullStatements.join(", ")}`
			: "";
	return dropStatements;
}

// if (
// 	tableColumn.originalIsNullable === undefined &&
// 	tableColumn.isNullable !== true
// ) {
// 	dropNotNullStatements.push(
// 		`ALTER COLUMN "${column}" DROP NOT NULL`,
// 	);
// }
