import { Difference } from "microdiff";
import { ChangeSetType, Changeset } from "~/database/changeset.js";
import {
	MigrationOpPriority,
	executeKyselySchemaStatement,
} from "../migration_op.js";

export type ColumnPrimaryKeyDifference = {
	type: "CHANGE";
	path: ["table", string, string, "primaryKey"];
	value: true | null;
	oldValue: true | null;
};

export function isColumnPrimaryKey(
	test: Difference,
): test is ColumnPrimaryKeyDifference {
	return (
		test.type === "CHANGE" &&
		test.path[0] === "table" &&
		test.path.length === 4 &&
		test.path[3] === "primaryKey"
	);
}

export function columnPrimaryKeyMigrationOperation(
	diff: ColumnPrimaryKeyDifference,
) {
	const tableName = diff.path[1];
	const columnName = diff.path[2];
	const changeset: Changeset = {
		priority:
			diff.value === null
				? MigrationOpPriority.ChangeColumnPrimaryKeyDrop
				: MigrationOpPriority.ChangeColumnPrimaryKeyCreate,
		tableName: tableName,
		type: ChangeSetType.ChangeColumn,
		up:
			diff.value === null
				? executeKyselySchemaStatement(
						`alterTable("${tableName}")`,
						`dropConstraint(\"${tableName}_pk\")`,
				  )
				: executeKyselySchemaStatement(
						`alterTable("${tableName}")`,
						`alterColumn(\"${columnName}\", (col) => col.primaryKey())`,
				  ),
		down:
			diff.value === null
				? executeKyselySchemaStatement(
						`alterTable("${tableName}")`,
						`alterColumn(\"${columnName}\", (col) => col.primaryKey())`,
				  )
				: executeKyselySchemaStatement(
						`alterTable("${tableName}")`,
						`dropConstraint(\"${tableName}_pk\")`,
				  ),
	};
	return changeset;
}
