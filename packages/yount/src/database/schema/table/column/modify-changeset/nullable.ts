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
import { executeKyselySchemaStatement } from "../../../../../changeset/helpers.js";

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
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	schemaName: string,
) {
	if (isColumnNullable(diff)) {
		return columnNullableMigrationOperation(diff, schemaName);
	}
}

type ColumnNullableDifference = {
	type: "CHANGE";
	path: ["table", string, "columns", string, "isNullable"];
	value: boolean;
	oldValue: boolean;
};

function isColumnNullable(test: Difference): test is ColumnNullableDifference {
	return (
		test.type === "CHANGE" &&
		test.path[0] === "table" &&
		test.path.length === 5 &&
		test.path[2] === "columns" &&
		test.path[4] === "isNullable"
	);
}

function columnNullableMigrationOperation(
	diff: ColumnNullableDifference,
	schemaName: string,
) {
	const tableName = diff.path[1];
	const columnName = diff.path[3];
	const changeset: Changeset = {
		priority: MigrationOpPriority.ChangeColumnNullable,
		tableName: tableName,
		type: ChangeSetType.ChangeColumn,
		up: diff.value
			? [
					executeKyselySchemaStatement(
						schemaName,
						`alterTable("${tableName}")`,
						`alterColumn("${columnName}", (col) => col.dropNotNull())`,
					),
				]
			: [
					executeKyselySchemaStatement(
						schemaName,
						`alterTable("${tableName}")`,
						`alterColumn("${columnName}", (col) => col.setNotNull())`,
					),
				],
		down: diff.value
			? [
					executeKyselySchemaStatement(
						schemaName,
						`alterTable("${tableName}")`,
						`alterColumn("${columnName}", (col) => col.setNotNull())`,
					),
				]
			: [
					executeKyselySchemaStatement(
						schemaName,
						`alterTable("${tableName}")`,
						`alterColumn("${columnName}", (col) => col.dropNotNull())`,
					),
				],
	};
	return changeset;
}
