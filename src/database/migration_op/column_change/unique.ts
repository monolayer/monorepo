import { Difference } from "microdiff";
import { ChangeSetType, Changeset } from "~/database/migration_op/changeset.js";
import { type ColumnInfo, ColumnUnique } from "~/database/schema/pg_column.js";
import {
	executeKyselyDbStatement,
	executeKyselyDbStatements,
} from "../helpers.js";
import { MigrationOpPriority } from "../priority.js";

export type UniqueAddDifference = {
	type: "CHANGE";
	path: ["table", string, string, "unique"];
	value: NonNullable<ColumnInfo["unique"]>;
	oldValue: null;
};

export type UniqueDropDifference = {
	type: "CHANGE";
	path: ["table", string, string, "unique"];
	value: null;
	oldValue: NonNullable<ColumnInfo["unique"]>;
};

export type UniqueChangeDifference = {
	type: "CHANGE";
	path: ["table", string, string, "unique"];
	value: NonNullable<ColumnInfo["unique"]>;
	oldValue: NonNullable<ColumnInfo["unique"]>;
};

export function isUniqueAdd(test: Difference): test is UniqueAddDifference {
	return (
		test.type === "CHANGE" &&
		test.path[0] === "table" &&
		test.path.length === 4 &&
		test.path[3] === "unique" &&
		test.value !== null &&
		test.oldValue === null
	);
}

export function isUniqueDrop(test: Difference): test is UniqueDropDifference {
	return (
		test.type === "CHANGE" &&
		test.path[0] === "table" &&
		test.path.length === 4 &&
		test.path[3] === "unique" &&
		test.value === null &&
		test.oldValue !== null
	);
}

export function isUniqueChange(
	test: Difference,
): test is UniqueChangeDifference {
	return (
		test.type === "CHANGE" &&
		test.path[0] === "table" &&
		test.path.length === 4 &&
		test.path[3] === "unique" &&
		test.value !== null &&
		test.oldValue !== null
	);
}

export function columnUniqueNullDistinctAddMigrationOperation(
	diff: UniqueAddDifference,
) {
	const tableName = diff.path[1];
	const columnName = diff.path[2];
	const changeset: Changeset = {
		priority: MigrationOpPriority.ChangeColumnUniqueAdd,
		tableName: tableName,
		type: ChangeSetType.ChangeColumn,
		up:
			diff.value === ColumnUnique.NullsDistinct
				? executeKyselyDbStatement(
						`ALTER TABLE ${tableName} ADD CONSTRAINT ${tableName}_${columnName}_key UNIQUE (${columnName})`,
				  )
				: executeKyselyDbStatement(
						`ALTER TABLE ${tableName} ADD CONSTRAINT ${tableName}_${columnName}_key UNIQUE NULLS NOT DISTINCT (${columnName})`,
				  ),
		down: executeKyselyDbStatement(
			`ALTER TABLE ${tableName} DROP CONSTRAINT ${tableName}_${columnName}_key`,
		),
	};
	return changeset;
}

export function columnUniqueNullDistinctDropMigrationOperation(
	diff: UniqueDropDifference,
) {
	const tableName = diff.path[1];
	const columnName = diff.path[2];
	const changeset: Changeset = {
		priority: MigrationOpPriority.ChangeColumnUniqueDrop,
		tableName: tableName,
		type: ChangeSetType.ChangeColumn,
		up: executeKyselyDbStatement(
			`ALTER TABLE ${tableName} DROP CONSTRAINT ${tableName}_${columnName}_key`,
		),
		down:
			diff.oldValue === ColumnUnique.NullsDistinct
				? executeKyselyDbStatement(
						`ALTER TABLE ${tableName} ADD CONSTRAINT ${tableName}_${columnName}_key UNIQUE (${columnName})`,
				  )
				: executeKyselyDbStatement(
						`ALTER TABLE ${tableName} ADD CONSTRAINT ${tableName}_${columnName}_key UNIQUE NULLS NOT DISTINCT (${columnName})`,
				  ),
	};
	return changeset;
}

export function columnUniqueNullDistinctChangeMigrationOperation(
	diff: UniqueChangeDifference,
) {
	const tableName = diff.path[1];
	const columnName = diff.path[2];
	const changeset: Changeset = {
		priority: MigrationOpPriority.ChangeColumnUniqueChange,
		tableName: tableName,
		type: ChangeSetType.ChangeColumn,
		up:
			diff.value === ColumnUnique.NullsDistinct
				? executeKyselyDbStatements([
						`ALTER TABLE ${tableName} DROP CONSTRAINT ${tableName}_${columnName}_key`,
						`ALTER TABLE ${tableName} ADD CONSTRAINT ${tableName}_${columnName}_key UNIQUE (${columnName})`,
				  ])
				: executeKyselyDbStatements([
						`ALTER TABLE ${tableName} DROP CONSTRAINT ${tableName}_${columnName}_key`,
						`ALTER TABLE ${tableName} ADD CONSTRAINT ${tableName}_${columnName}_key UNIQUE NULLS NOT DISTINCT (${columnName})`,
				  ]),
		down:
			diff.oldValue === ColumnUnique.NullsDistinct
				? executeKyselyDbStatements([
						`ALTER TABLE ${tableName} DROP CONSTRAINT ${tableName}_${columnName}_key`,
						`ALTER TABLE ${tableName} ADD CONSTRAINT ${tableName}_${columnName}_key UNIQUE (${columnName})`,
				  ])
				: executeKyselyDbStatements([
						`ALTER TABLE ${tableName} DROP CONSTRAINT ${tableName}_${columnName}_key`,
						`ALTER TABLE ${tableName} ADD CONSTRAINT ${tableName}_${columnName}_key UNIQUE NULLS NOT DISTINCT (${columnName})`,
				  ]),
	};
	return changeset;
}
