import { Difference } from "microdiff";
import {
	ChangeSetType,
	Changeset,
	MigrationOpPriority,
} from "~/changeset/types.js";
import type {
	DbTableInfo,
	LocalTableInfo,
} from "~/introspection/introspection.js";
import { executeKyselySchemaStatement } from "../../../../changeset/helpers.js";

export function columnNullableMigrationOpGenerator(
	diff: Difference,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	_addedTables: string[],
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	_droppedTables: string[],
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	_local: LocalTableInfo,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	_db: DbTableInfo,
) {
	if (isColumnNullable(diff)) {
		return columnNullableMigrationOperation(diff);
	}
}

type ColumnNullableDifference = {
	type: "CHANGE";
	path: ["table", string, string, "isNullable"];
	value: boolean;
	oldValue: boolean;
};

function isColumnNullable(test: Difference): test is ColumnNullableDifference {
	return (
		test.type === "CHANGE" &&
		test.path[0] === "table" &&
		test.path.length === 4 &&
		test.path[3] === "isNullable"
	);
}

function columnNullableMigrationOperation(diff: ColumnNullableDifference) {
	const tableName = diff.path[1];
	const columnName = diff.path[2];
	const changeset: Changeset = {
		priority: MigrationOpPriority.ChangeColumnNullable,
		tableName: tableName,
		type: ChangeSetType.ChangeColumn,
		up: diff.value
			? [
					executeKyselySchemaStatement(
						`alterTable("${tableName}")`,
						`alterColumn("${columnName}", (col) => col.dropNotNull())`,
					),
				]
			: [
					executeKyselySchemaStatement(
						`alterTable("${tableName}")`,
						`alterColumn("${columnName}", (col) => col.setNotNull())`,
					),
				],
		down: diff.value
			? [
					executeKyselySchemaStatement(
						`alterTable("${tableName}")`,
						`alterColumn("${columnName}", (col) => col.setNotNull())`,
					),
				]
			: [
					executeKyselySchemaStatement(
						`alterTable("${tableName}")`,
						`alterColumn("${columnName}", (col) => col.dropNotNull())`,
					),
				],
	};
	return changeset;
}
