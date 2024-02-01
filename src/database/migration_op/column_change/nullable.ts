import { Difference } from "microdiff";
import { ChangeSetType, Changeset } from "~/database/changeset.js";
import {
	MigrationOpPriority,
	executeKyselySchemaStatement,
} from "../migration_op.js";

export type ColumnNullableDifference = {
	type: "CHANGE";
	path: ["table", string, string, "isNullable"];
	value: true | null;
	oldValue: true | null;
};

export function isColumnNullable(
	test: Difference,
): test is ColumnNullableDifference {
	return (
		test.type === "CHANGE" &&
		test.path[0] === "table" &&
		test.path.length === 4 &&
		test.path[3] === "isNullable"
	);
}

export function columnNullableMigrationOperation(
	diff: ColumnNullableDifference,
) {
	const tableName = diff.path[1];
	const columnName = diff.path[2];
	const changeset: Changeset = {
		priority: MigrationOpPriority.ChangeColumnBase,
		tableName: tableName,
		type: ChangeSetType.ChangeColumn,
		up:
			diff.value === null
				? executeKyselySchemaStatement(
						`alterTable("${tableName}")`,
						`alterColumn(\"${columnName}\", (col) => col.dropNotNull())`,
				  )
				: executeKyselySchemaStatement(
						`alterTable("${tableName}")`,
						`alterColumn(\"${columnName}\", (col) => col.setNotNull())`,
				  ),
		down:
			diff.value === null
				? executeKyselySchemaStatement(
						`alterTable("${tableName}")`,
						`alterColumn(\"${columnName}\", (col) => col.setNotNull())`,
				  )
				: executeKyselySchemaStatement(
						`alterTable("${tableName}")`,
						`alterColumn(\"${columnName}\", (col) => col.dropNotNull())`,
				  ),
	};
	return changeset;
}
