import { Difference } from "microdiff";
import type {
	DbTableInfo,
	LocalTableInfo,
} from "~/database/introspection/types.js";
import { ChangeSetType, Changeset } from "~/database/migration_op/changeset.js";
import { type ColumnInfo, ColumnUnique } from "~/database/schema/pg_column.js";
import {
	executeKyselyDbStatement,
	executeKyselyDbStatements,
} from "../helpers.js";
import { MigrationOpPriority } from "../priority.js";

export function uniqueMigrationOpGenerator(
	diff: Difference,
	_addedTables: string[],
	_droppedTables: string[],
	_local: LocalTableInfo,
	_db: DbTableInfo,
) {
	if (isUniqueAdd(diff)) {
		return columnUniqueNullDistinctAddMigrationOperation(diff);
	}
	if (isUniqueDrop(diff)) {
		return columnUniqueNullDistinctDropMigrationOperation(diff);
	}
	if (isUniqueChange(diff)) {
		return columnUniqueNullDistinctChangeMigrationOperation(diff);
	}
}

type UniqueAddDifference = {
	type: "CHANGE";
	path: ["table", string, string, "unique"];
	value: NonNullable<ColumnInfo["unique"]>;
	oldValue: null;
};

type UniqueDropDifference = {
	type: "CHANGE";
	path: ["table", string, string, "unique"];
	value: null;
	oldValue: NonNullable<ColumnInfo["unique"]>;
};

type UniqueChangeDifference = {
	type: "CHANGE";
	path: ["table", string, string, "unique"];
	value: NonNullable<ColumnInfo["unique"]>;
	oldValue: NonNullable<ColumnInfo["unique"]>;
};

function isUniqueAdd(test: Difference): test is UniqueAddDifference {
	return (
		test.type === "CHANGE" &&
		test.path[0] === "table" &&
		test.path.length === 4 &&
		test.path[3] === "unique" &&
		test.value !== null &&
		test.oldValue === null
	);
}

function isUniqueDrop(test: Difference): test is UniqueDropDifference {
	return (
		test.type === "CHANGE" &&
		test.path[0] === "table" &&
		test.path.length === 4 &&
		test.path[3] === "unique" &&
		test.value === null &&
		test.oldValue !== null
	);
}

function isUniqueChange(test: Difference): test is UniqueChangeDifference {
	return (
		test.type === "CHANGE" &&
		test.path[0] === "table" &&
		test.path.length === 4 &&
		test.path[3] === "unique" &&
		test.value !== null &&
		test.oldValue !== null
	);
}

function columnUniqueNullDistinctAddMigrationOperation(
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

function columnUniqueNullDistinctDropMigrationOperation(
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

function columnUniqueNullDistinctChangeMigrationOperation(
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
