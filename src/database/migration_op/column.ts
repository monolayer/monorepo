import { Difference } from "microdiff";
import { ChangeSetType, Changeset } from "~/database/migration_op/changeset.js";
import type { DbTableInfo, LocalTableInfo } from "../introspection/types.js";
import { executeKyselySchemaStatement } from "./helpers.js";
import { MigrationOpPriority } from "./priority.js";
import { type ColumnInfoDiff, optionsForColumn } from "./table_common.js";

export function columnMigrationOpGenerator(
	diff: Difference,
	_addedTables: string[],
	_droppedTables: string[],
	_local: LocalTableInfo,
	_db: DbTableInfo,
) {
	if (isCreateColumn(diff)) {
		return createColumnMigration(diff);
	}
	if (isDropColumn(diff)) {
		return dropColumnMigration(diff);
	}
}

type CreateColumnDiff = {
	type: "CREATE";
	path: ["table", string, string];
	value: ColumnInfoDiff;
};

function isCreateColumn(test: Difference): test is CreateColumnDiff {
	return (
		test.type === "CREATE" && test.path.length === 3 && test.path[0] === "table"
	);
}

function createColumnMigration(diff: CreateColumnDiff) {
	const tableName = diff.path[1];
	const columnName = diff.path[2];
	const columnDef = diff.value;

	const changeset: Changeset = {
		priority: MigrationOpPriority.ColumnCreate,
		tableName: tableName,
		type: ChangeSetType.CreateColumn,
		up: executeKyselySchemaStatement(
			`alterTable("${tableName}")`,
			`addColumn(\"${columnName}\", \"${columnDef.dataType}\"${optionsForColumn(
				columnDef,
			)})`,
		),
		down: executeKyselySchemaStatement(
			`alterTable("${tableName}")`,
			`dropColumn(\"${columnName}\")`,
		),
	};
	return changeset;
}

type DropColumnDiff = {
	type: "REMOVE";
	path: ["table", string, string];
	oldValue: ColumnInfoDiff;
};

function isDropColumn(test: Difference): test is DropColumnDiff {
	return (
		test.type === "REMOVE" && test.path.length === 3 && test.path[0] === "table"
	);
}

function dropColumnMigration(diff: DropColumnDiff) {
	const tableName = diff.path[1];
	const columnDef = diff.oldValue;
	const columnName = diff.path[2];

	const changeset: Changeset = {
		priority: MigrationOpPriority.ColumnDrop,
		tableName: tableName,
		type: ChangeSetType.DropColumn,
		up: executeKyselySchemaStatement(
			`alterTable("${tableName}")`,
			`dropColumn(\"${columnName}\")`,
		),

		down: executeKyselySchemaStatement(
			`alterTable("${tableName}")`,
			`addColumn(\"${columnName}\", \"${columnDef.dataType}\"${optionsForColumn(
				columnDef,
			)})`,
		),
	};
	return changeset;
}
