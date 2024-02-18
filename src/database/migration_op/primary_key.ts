import type { Difference } from "microdiff";
import type { DbTableInfo, LocalTableInfo } from "../introspection/types.js";
import { ChangeSetType, type Changeset } from "./changeset.js";
import { executeKyselyDbStatement } from "./helpers.js";
import { MigrationOpPriority } from "./priority.js";

export function primaryKeyMigrationOpGenerator(
	diff: Difference,
	addedTables: string[],
	droppedTables: string[],
	_local: LocalTableInfo,
	_db: DbTableInfo,
) {
	if (isPrimaryKeyCreateFirst(diff)) {
		return createPrimaryKeyMigration(diff, addedTables);
	}
	if (isPrimaryKeyDrop(diff)) {
		return dropPrimaryKeyMigration(diff, droppedTables);
	}
	if (isPrimaryKeyUpdate(diff)) {
		return updatePrimaryKeyMigration(diff, addedTables, droppedTables);
	}
	if (isPrimaryKeyReplace(diff)) {
		return replacePrimaryKeyMigration(diff, addedTables, droppedTables);
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
): Changeset {
	const tableName = diff.path[1];
	const indexName = Object.keys(diff.value)[0] as keyof typeof diff.value;
	const indexValue = diff.value[
		indexName
	] as (typeof diff.value)[keyof typeof diff.value];

	return {
		priority: MigrationOpPriority.ConstraintCreate,
		tableName: tableName,
		type: ChangeSetType.CreateConstraint,
		up: executeKyselyDbStatement(
			`ALTER TABLE ${tableName} ADD CONSTRAINT ${indexValue}`,
		),
		down: addedTables.includes(tableName)
			? []
			: executeKyselyDbStatement(
					`ALTER TABLE ${tableName} DROP CONSTRAINT ${indexName}`,
			  ),
	};
}

function dropPrimaryKeyMigration(
	diff: PrimaryKeyDropDiff,
	droppedTables: string[],
): Changeset {
	const tableName = diff.path[1];
	const indexName = Object.keys(diff.oldValue)[0] as keyof typeof diff.oldValue;
	const indexValue = diff.oldValue[
		indexName
	] as (typeof diff.oldValue)[keyof typeof diff.oldValue];

	return {
		priority: MigrationOpPriority.ConstraintDrop,
		tableName: tableName,
		type: ChangeSetType.DropConstraint,
		up: droppedTables.includes(tableName)
			? []
			: executeKyselyDbStatement(
					`ALTER TABLE ${tableName} DROP CONSTRAINT ${indexName}`,
			  ),
		down: executeKyselyDbStatement(
			`ALTER TABLE ${tableName} ADD CONSTRAINT ${indexValue}`,
		),
	};
}

function updatePrimaryKeyMigration(
	diff: PrimaryKeyUpdateDiff,
	addedTables: string[],
	droppedTables: string[],
): Changeset {
	const tableName = diff.path[1];
	const indexName = diff.path[2];
	const indexValue = diff.value;

	return {
		priority: MigrationOpPriority.ConstraintCreate,
		tableName: tableName,
		type: ChangeSetType.CreateConstraint,
		up: droppedTables.includes(tableName)
			? []
			: executeKyselyDbStatement(
					`ALTER TABLE ${tableName} ADD CONSTRAINT ${indexValue}`,
			  ),
		down: addedTables.includes(tableName)
			? []
			: executeKyselyDbStatement(
					`ALTER TABLE ${tableName} DROP CONSTRAINT ${indexName}`,
			  ),
	};
}

function replacePrimaryKeyMigration(
	diff: PrimaryKeyReplaceDiff,
	addedTables: string[],
	droppedTables: string[],
): Changeset {
	const tableName = diff.path[1];
	const indexName = diff.path[2];
	const indexValue = diff.oldValue;

	return {
		priority: MigrationOpPriority.ConstraintDrop,
		tableName: tableName,
		type: ChangeSetType.DropConstraint,
		up: droppedTables.includes(tableName)
			? []
			: executeKyselyDbStatement(
					`ALTER TABLE ${tableName} DROP CONSTRAINT ${indexName}`,
			  ),
		down: addedTables.includes(tableName)
			? []
			: executeKyselyDbStatement(
					`ALTER TABLE ${tableName} ADD CONSTRAINT ${indexValue}`,
			  ),
	};
}

export function primaryKeyMigrationOps(
	diff: Difference[],
	addedTables: string[],
	droppedTables: string[],
) {
	if (diff.length === 0) {
		return [];
	}
	return diff.flatMap((d) => {
		if (isPrimaryKeyCreateFirst(d)) {
			return createPrimaryKeyMigration(d, addedTables);
		}
		if (isPrimaryKeyDrop(d)) {
			return dropPrimaryKeyMigration(d, droppedTables);
		}
		if (isPrimaryKeyUpdate(d)) {
			return updatePrimaryKeyMigration(d, addedTables, droppedTables);
		}
		if (isPrimaryKeyReplace(d)) {
			return replacePrimaryKeyMigration(d, addedTables, droppedTables);
		}
		return [];
	});
}
