import { Difference } from "microdiff";
import type {
	DbTableInfo,
	LocalTableInfo,
} from "~/database/introspection/types.js";
import { ChangeSetType, Changeset } from "~/database/migration_op/changeset.js";
import { executeKyselySchemaStatement } from "../helpers.js";
import { MigrationOpPriority } from "../priority.js";

export function columnNullableMigrationOpGenerator(
	diff: Difference,
	_addedTables: string[],
	_droppedTables: string[],
	_local: LocalTableInfo,
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
						`alterColumn(\"${columnName}\", (col) => col.dropNotNull())`,
					),
			  ]
			: [
					executeKyselySchemaStatement(
						`alterTable("${tableName}")`,
						`alterColumn(\"${columnName}\", (col) => col.setNotNull())`,
					),
			  ],
		down: diff.value
			? [
					executeKyselySchemaStatement(
						`alterTable("${tableName}")`,
						`alterColumn(\"${columnName}\", (col) => col.setNotNull())`,
					),
			  ]
			: [
					executeKyselySchemaStatement(
						`alterTable("${tableName}")`,
						`alterColumn(\"${columnName}\", (col) => col.dropNotNull())`,
					),
			  ],
	};
	return changeset;
}
