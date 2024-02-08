import type { Difference } from "microdiff";
import { ChangeSetType } from "../changeset.js";
import { MigrationOpPriority, executeKyselyDbStatement } from "./compute.js";

type ForeignKeyCreateDiff = {
	type: "CREATE";
	path: ["foreignKeyConstraints", string];
	value: {
		[key: string]: string;
	};
};

type ForeignKeyDropDiff = {
	type: "REMOVE";
	path: ["foreignKeyConstraints", string];
	oldValue: {
		[key: string]: string;
	};
};

type ForeignKeyChangeDiff = {
	type: "CHANGE";
	path: ["foreignKeyConstraints", string, string];
	value: string;
	oldValue: string;
};

function isForeignKeyCreate(test: Difference): test is ForeignKeyCreateDiff {
	return (
		test.type === "CREATE" &&
		test.path.length === 2 &&
		test.path[0] === "foreignKeyConstraints" &&
		typeof test.path[1] === "string" &&
		typeof test.value === "object" &&
		Object.keys(test.value).length === 1
	);
}

function isForeignKeyDrop(test: Difference): test is ForeignKeyDropDiff {
	return (
		test.type === "REMOVE" &&
		test.path.length === 2 &&
		test.path[0] === "foreignKeyConstraints" &&
		typeof test.path[1] === "string" &&
		typeof test.oldValue === "object" &&
		Object.keys(test.oldValue).length === 1
	);
}

function isForeignKeyChange(test: Difference): test is ForeignKeyChangeDiff {
	return (
		test.type === "CHANGE" &&
		test.path.length === 3 &&
		test.path[0] === "foreignKeyConstraints" &&
		typeof test.path[1] === "string" &&
		typeof test.path[2] === "string" &&
		typeof test.value === "string" &&
		typeof test.oldValue === "string"
	);
}

function createforeignKeyConstraintMigration(
	diff: ForeignKeyCreateDiff,
	addedTables: string[],
) {
	const tableName = diff.path[1];
	const constraintName = Object.keys(diff.value)[0] as keyof typeof diff.value;
	const constraintValue = diff.value[
		constraintName
	] as (typeof diff.value)[keyof typeof diff.value];

	return {
		priority: MigrationOpPriority.ForeignKeyConstraintCreate,
		tableName: tableName,
		type: ChangeSetType.CreateForeignKeyConstraint,
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

function dropforeignKeyConstraintMigration(
	diff: ForeignKeyDropDiff,
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
		priority: MigrationOpPriority.ForeignKeyConstraintDrop,
		tableName: tableName,
		type: ChangeSetType.DropForeignKeyConstraint,
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

function changeforeignKeyConstraintMigration(diff: ForeignKeyChangeDiff) {
	const tableName = diff.path[1];
	const constraintName = diff.path[2];
	const newValue = diff.value;
	const oldValue = diff.oldValue;
	return {
		priority: MigrationOpPriority.ForeignKeyConstraintChange,
		tableName: tableName,
		type: ChangeSetType.ChangeForeignKeyConstraint,
		up: executeKyselyDbStatement(
			`ALTER TABLE ${tableName} DROP CONSTRAINT ${constraintName}, ADD CONSTRAINT ${newValue}`,
		),
		down: executeKyselyDbStatement(
			`ALTER TABLE ${tableName} DROP CONSTRAINT ${constraintName}, ADD CONSTRAINT ${oldValue}`,
		),
	};
}

export function foreignKeyMigrationOps(
	diff: Difference[],
	addedTables: string[],
	droppedTables: string[],
) {
	if (diff.length === 0) {
		return [];
	}
	return diff.flatMap((d) => {
		if (isForeignKeyCreate(d)) {
			return createforeignKeyConstraintMigration(d, addedTables);
		}
		if (isForeignKeyDrop(d)) {
			return dropforeignKeyConstraintMigration(d, droppedTables);
		}
		if (isForeignKeyChange(d)) {
			return changeforeignKeyConstraintMigration(d);
		}
		return [];
	});
}
