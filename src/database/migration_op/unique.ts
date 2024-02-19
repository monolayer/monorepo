import type { Difference } from "microdiff";
import type { DbTableInfo, LocalTableInfo } from "../introspection/types.js";
import { ChangeSetType } from "./changeset.js";
import { executeKyselyDbStatement } from "./helpers.js";
import { MigrationOpPriority } from "./priority.js";

export function uniqueConstraintMigrationOpGenerator(
	diff: Difference,
	addedTables: string[],
	droppedTables: string[],
	_local: LocalTableInfo,
	_db: DbTableInfo,
) {
	if (isUniqueConstraintCreateFirst(diff)) {
		return createUniqueFirstConstraintMigration(diff, addedTables);
	}
	if (isUniqueConstraintDropLast(diff)) {
		return dropUniqueLastConstraintMigration(diff, droppedTables);
	}
	if (isUniqueConstraintChange(diff)) {
		return changeUniqueConstraintMigration(diff);
	}
	if (isUniqueContraintCreateDiff(diff)) {
		return createUniqueConstraintMigration(diff);
	}
	if (isUniqueConstraintDropDiff(diff)) {
		return dropUniqueConstraintMigration(diff);
	}
}

type UniqueCreateFirst = {
	type: "CREATE";
	path: ["uniqueConstraints", string];
	value: {
		[key: string]: string;
	};
};

type UniqueCreateDiff = {
	type: "CREATE";
	path: ["uniqueConstraints", string, string];
	value: string;
};

type UniqueDropLast = {
	type: "REMOVE";
	path: ["uniqueConstraints", string];
	oldValue: {
		[key: string]: string;
	};
};

type UuniqueDropDiff = {
	type: "REMOVE";
	path: ["uniqueConstraints", string, string];
	oldValue: string;
};

type UniqueChangeDiff = {
	type: "CHANGE";
	path: ["uniqueConstraints", string, string];
	value: string;
	oldValue: string;
};

function isUniqueConstraintCreateFirst(
	test: Difference,
): test is UniqueCreateFirst {
	return (
		test.type === "CREATE" &&
		test.path.length === 2 &&
		test.path[0] === "uniqueConstraints" &&
		typeof test.path[1] === "string" &&
		typeof test.value === "object" &&
		Object.keys(test.value).length === 1
	);
}

function isUniqueContraintCreateDiff(
	test: Difference,
): test is UniqueCreateDiff {
	return (
		test.type === "CREATE" &&
		test.path.length === 3 &&
		test.path[0] === "uniqueConstraints" &&
		typeof test.path[1] === "string" &&
		typeof test.path[2] === "string" &&
		typeof test.value === "string"
	);
}

function isUniqueConstraintDropLast(test: Difference): test is UniqueDropLast {
	return (
		test.type === "REMOVE" &&
		test.path.length === 2 &&
		test.path[0] === "uniqueConstraints" &&
		typeof test.path[1] === "string" &&
		typeof test.oldValue === "object" &&
		Object.keys(test.oldValue).length === 1
	);
}

function isUniqueConstraintDropDiff(test: Difference): test is UuniqueDropDiff {
	return (
		test.type === "REMOVE" &&
		test.path.length === 3 &&
		test.path[0] === "uniqueConstraints" &&
		typeof test.path[1] === "string" &&
		typeof test.path[2] === "string" &&
		typeof test.oldValue === "string"
	);
}

function isUniqueConstraintChange(test: Difference): test is UniqueChangeDiff {
	return (
		test.type === "CHANGE" &&
		test.path.length === 3 &&
		test.path[0] === "uniqueConstraints" &&
		typeof test.path[1] === "string" &&
		typeof test.path[2] === "string" &&
		typeof test.value === "string" &&
		typeof test.oldValue === "string"
	);
}

function createUniqueFirstConstraintMigration(
	diff: UniqueCreateFirst,
	addedTables: string[],
) {
	const tableName = diff.path[1];
	const constraintName = Object.keys(diff.value)[0] as keyof typeof diff.value;
	const constraintValue = diff.value[
		constraintName
	] as (typeof diff.value)[keyof typeof diff.value];

	return {
		priority: MigrationOpPriority.ConstraintCreate,
		tableName: tableName,
		type: ChangeSetType.CreateConstraint,
		up: executeKyselyDbStatement(
			`ALTER TABLE ${tableName} ADD CONSTRAINT ${constraintValue}`,
		),
		down: addedTables.includes(tableName)
			? []
			: executeKyselyDbStatement(
					`ALTER TABLE ${tableName} DROP CONSTRAINT ${constraintName}`,
			  ),
	};
}

function dropUniqueLastConstraintMigration(
	diff: UniqueDropLast,
	droppedTables: string[],
) {
	const tableName = diff.path[1];
	const constraintName = Object.keys(
		diff.oldValue,
	)[0] as keyof typeof diff.oldValue;
	const constraintValue = diff.oldValue[
		constraintName
	] as (typeof diff.oldValue)[keyof typeof diff.oldValue];

	return {
		priority: MigrationOpPriority.ConstraintDrop,
		tableName: tableName,
		type: ChangeSetType.DropConstraint,
		up: droppedTables.includes(tableName)
			? []
			: executeKyselyDbStatement(
					`ALTER TABLE ${tableName} DROP CONSTRAINT ${constraintName}`,
			  ),
		down: executeKyselyDbStatement(
			`ALTER TABLE ${tableName} ADD CONSTRAINT ${constraintValue}`,
		),
	};
}

function changeUniqueConstraintMigration(diff: UniqueChangeDiff) {
	const tableName = diff.path[1];
	const constraintName = diff.path[2];
	const newValue = diff.value;
	const oldValue = diff.oldValue;
	return {
		priority: MigrationOpPriority.ConstraintChange,
		tableName: tableName,
		type: ChangeSetType.ChangeConstraint,
		up: executeKyselyDbStatement(
			`ALTER TABLE ${tableName} DROP CONSTRAINT ${constraintName}, ADD CONSTRAINT ${newValue}`,
		),
		down: executeKyselyDbStatement(
			`ALTER TABLE ${tableName} DROP CONSTRAINT ${constraintName}, ADD CONSTRAINT ${oldValue}`,
		),
	};
}

function createUniqueConstraintMigration(diff: UniqueCreateDiff) {
	const tableName = diff.path[1];
	const constraintName = diff.path[2];
	const constraintValue = diff.value;
	return {
		priority: MigrationOpPriority.ConstraintCreate,
		tableName: tableName,
		type: ChangeSetType.CreateConstraint,
		up: executeKyselyDbStatement(
			`ALTER TABLE ${tableName} ADD CONSTRAINT ${constraintValue}`,
		),
		down: executeKyselyDbStatement(
			`ALTER TABLE ${tableName} DROP CONSTRAINT ${constraintName}`,
		),
	};
}

function dropUniqueConstraintMigration(diff: UuniqueDropDiff) {
	const tableName = diff.path[1];
	const constraintName = diff.path[2];
	const constraintValue = diff.oldValue;
	return {
		priority: MigrationOpPriority.ConstraintDrop,
		tableName: tableName,
		type: ChangeSetType.DropConstraint,
		up: executeKyselyDbStatement(
			`ALTER TABLE ${tableName} DROP CONSTRAINT ${constraintName}`,
		),
		down: executeKyselyDbStatement(
			`ALTER TABLE ${tableName} ADD CONSTRAINT ${constraintValue}`,
		),
	};
}

export function uniqueMigrationOps(
	diff: Difference[],
	addedTables: string[],
	droppedTables: string[],
) {
	if (diff.length === 0) {
		return [];
	}
	return diff.flatMap((d) => {
		if (isUniqueConstraintCreateFirst(d)) {
			return createUniqueFirstConstraintMigration(d, addedTables);
		}
		if (isUniqueConstraintDropLast(d)) {
			return dropUniqueLastConstraintMigration(d, droppedTables);
		}
		if (isUniqueConstraintChange(d)) {
			return changeUniqueConstraintMigration(d);
		}
		return [];
	});
}
