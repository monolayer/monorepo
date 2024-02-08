import type { Difference } from "microdiff";
import { ChangeSetType } from "../changeset.js";
import { MigrationOpPriority, executeKyselyDbStatement } from "./compute.js";

type UniqueCreateDiff = {
	type: "CREATE";
	path: ["uniqueConstraints", string];
	value: {
		[key: string]: string;
	};
};

type UniqueDropDiff = {
	type: "REMOVE";
	path: ["uniqueConstraints", string];
	oldValue: {
		[key: string]: string;
	};
};

type UniqueChangeDiff = {
	type: "CHANGE";
	path: ["uniqueConstraints", string, string];
	value: string;
	oldValue: string;
};

export function isUniqueConstraintCreate(
	test: Difference,
): test is UniqueCreateDiff {
	return (
		test.type === "CREATE" &&
		test.path.length === 2 &&
		test.path[0] === "uniqueConstraints" &&
		typeof test.path[1] === "string" &&
		typeof test.value === "object" &&
		Object.keys(test.value).length === 1
	);
}

export function isUniqueConstraintDrop(
	test: Difference,
): test is UniqueDropDiff {
	return (
		test.type === "REMOVE" &&
		test.path.length === 2 &&
		test.path[0] === "uniqueConstraints" &&
		typeof test.path[1] === "string" &&
		typeof test.oldValue === "object" &&
		Object.keys(test.oldValue).length === 1
	);
}

export function isUniqueConstraintChange(
	test: Difference,
): test is UniqueChangeDiff {
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

export function createUniqueConstraintMigration(
	diff: UniqueCreateDiff,
	addedTables: string[],
) {
	const tableName = diff.path[1];
	const constraintName = Object.keys(diff.value)[0] as keyof typeof diff.value;
	const constraintValue = diff.value[
		constraintName
	] as (typeof diff.value)[keyof typeof diff.value];

	return {
		priority: MigrationOpPriority.UniqueConstraintCreate,
		tableName: tableName,
		type: ChangeSetType.CreateUniqueConstraint,
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

export function dropUniqueConstraintMigration(
	diff: UniqueDropDiff,
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
		priority: MigrationOpPriority.UniqueConstraintDrop,
		tableName: tableName,
		type: ChangeSetType.DropUniqueConstraint,
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

export function changeUniqueConstraintMigration(diff: UniqueChangeDiff) {
	const tableName = diff.path[1];
	const constraintName = diff.path[2];
	const newValue = diff.value;
	const oldValue = diff.oldValue;
	return {
		priority: MigrationOpPriority.UniqueConstraintChange,
		tableName: tableName,
		type: ChangeSetType.ChangeUniqueConstraint,
		up: executeKyselyDbStatement(
			`ALTER TABLE ${tableName} DROP CONSTRAINT ${constraintName}, ADD CONSTRAINT ${newValue}`,
		),
		down: executeKyselyDbStatement(
			`ALTER TABLE ${tableName} DROP CONSTRAINT ${constraintName}, ADD CONSTRAINT ${oldValue}`,
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
		if (isUniqueConstraintCreate(d)) {
			return createUniqueConstraintMigration(d, addedTables);
		}
		if (isUniqueConstraintDrop(d)) {
			return dropUniqueConstraintMigration(d, droppedTables);
		}
		if (isUniqueConstraintChange(d)) {
			return changeUniqueConstraintMigration(d);
		}
		return [];
	});
}
