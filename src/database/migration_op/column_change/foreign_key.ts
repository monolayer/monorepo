import { Difference } from "microdiff";
import { ForeIgnKeyConstraintInfo } from "~/database/introspection/types.js";
import { ChangeSetType, Changeset } from "../../changeset.js";
import {
	MigrationOpPriority,
	executeKyselySchemaStatement,
} from "../migration_op.js";

export type ChangeColumnForeignConstraintAdd = {
	type: "CHANGE";
	path: ["table", string, string, "foreignKeyConstraint"];
	value: ForeIgnKeyConstraintInfo;
	oldValue: null;
};

export type ChangeColumnForeignConstraintRemove = {
	type: "CHANGE";
	path: ["table", string, string, "foreignKeyConstraint"];
	value: null;
	oldValue: ForeIgnKeyConstraintInfo;
};

export function isAddForeignKeyConstraintValue(
	test: Difference,
): test is ChangeColumnForeignConstraintAdd {
	return (
		test.type === "CHANGE" &&
		test.path[0] === "table" &&
		test.path.length === 4 &&
		test.path[3] === "foreignKeyConstraint" &&
		test.value !== null
	);
}

export function isRemoveForeignKeyConstraintValue(
	test: Difference,
): test is ChangeColumnForeignConstraintRemove {
	return (
		test.type === "CHANGE" &&
		test.path[0] === "table" &&
		test.path.length === 4 &&
		test.path[3] === "foreignKeyConstraint" &&
		test.oldValue !== null
	);
}

export function addColumnForeignKeyMigrationOperation(
	diff: ChangeColumnForeignConstraintAdd,
) {
	const tableName = diff.path[1];
	const columnName = diff.path[2];
	const changeset: Changeset = {
		priority: MigrationOpPriority.ChangeColumnForeignKeyCreate,
		tableName: tableName,
		type: ChangeSetType.ChangeColumn,
		up: executeKyselySchemaStatement(
			`alterTable("${tableName}")`,
			[
				`.addForeignKeyConstraint("${tableName}_${columnName}_fkey",`,
				`["${columnName}"], "${diff.value.table}",`,
				`["${diff.value.column}"])`,
			].join(" "),
		),
		down: executeKyselySchemaStatement(
			`alterTable("${tableName}")`,
			`.dropConstraint("${tableName}_${columnName}_fkey")`,
		),
	};
	return changeset;
}

export function removeColumnForeignKeyMigrationOperation(
	diff: ChangeColumnForeignConstraintRemove,
) {
	const tableName = diff.path[1];
	const columnName = diff.path[2];
	const changeset: Changeset = {
		priority: MigrationOpPriority.ChangeColumnForeignKeyDrop,
		tableName: tableName,
		type: ChangeSetType.ChangeColumn,
		up: executeKyselySchemaStatement(
			`alterTable("${tableName}")`,
			`.dropConstraint("${tableName}_${columnName}_fkey")`,
		),
		down: executeKyselySchemaStatement(
			`alterTable("${tableName}")`,
			[
				`.addForeignKeyConstraint("${tableName}_${columnName}_fkey",`,
				`["${columnName}"], "${diff.oldValue.table}",`,
				`["${diff.oldValue.column}"])`,
			].join(" "),
		),
	};
	return changeset;
}
