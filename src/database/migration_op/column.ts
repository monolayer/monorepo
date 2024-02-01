import { Difference } from "microdiff";
import { ChangeSetType, Changeset } from "../changeset.js";
import { ColumnInfo } from "../introspection/types.js";
import {
	MigrationOpPriority,
	executeKyselySchemaStatement,
} from "./migration_op.js";
import { foreignKeyConstraint, optionsForColumn } from "./table_common.js";

export function createColumnMigration(diff: CreateColumnDiff) {
	const tableName = diff.path[1];
	const columnName = diff.path[2];
	const columnDef = diff.value;

	const changeset: Changeset = {
		priority: MigrationOpPriority.Column,
		tableName: tableName,
		type: ChangeSetType.CreateColumn,
		up: executeKyselySchemaStatement(
			`alterTable("${tableName}")`,
			`addColumn(\"${columnName}\", \"${columnDef.dataType}\"${optionsForColumn(
				columnDef,
			)})`,
			foreignKeyConstraint(columnDef),
		),
		down: executeKyselySchemaStatement(
			`alterTable("${tableName}")`,
			`dropColumn(\"${columnName}\")`,
		),
	};
	return changeset;
}

export function dropColumnMigration(diff: DropColumnDiff) {
	const tableName = diff.path[1];
	const columnDef = diff.oldValue;
	const columnName = diff.path[2];

	const changeset: Changeset = {
		priority: MigrationOpPriority.Column,
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

export type CreateColumnDiff = {
	type: "CREATE";
	path: ["table", string, string];
	value: ColumnInfo;
};

export function isCreateColumn(test: Difference): test is CreateColumnDiff {
	return (
		test.type === "CREATE" && test.path.length === 3 && test.path[0] === "table"
	);
}

export type DropColumnDiff = {
	type: "REMOVE";
	path: ["table", string, string];
	oldValue: ColumnInfo;
};

export function isDropColumn(test: Difference): test is DropColumnDiff {
	return (
		test.type === "REMOVE" && test.path.length === 3 && test.path[0] === "table"
	);
}

export type ChangeColumnDiff = {
	type: "CHANGE";
	path: ["table", string, string, keyof ColumnInfo];
	value: string | boolean | number | null;
	oldValue: string | boolean | number | null;
};
