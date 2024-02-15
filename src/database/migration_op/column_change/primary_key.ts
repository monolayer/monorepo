import { Difference } from "microdiff";
import type {
	DbTableInfo,
	LocalTableInfo,
} from "~/database/introspection/types.js";
import { ChangeSetType, Changeset } from "~/database/migration_op/changeset.js";
import { executeKyselySchemaStatement } from "../helpers.js";
import { MigrationOpPriority } from "../priority.js";

export function columnPrimaryKeyMigrationOpGenerator(
	diff: Difference,
	_addedTables: string[],
	_droppedTables: string[],
	_local: LocalTableInfo,
	_db: DbTableInfo,
) {
	if (isColumnPrimaryKey(diff)) {
		return columnPrimaryKeyMigrationOperation(diff);
	}
}

type ColumnPrimaryKeyDifference = {
	type: "CHANGE";
	path: ["table", string, string, "primaryKey"];
	value: true | null;
	oldValue: true | null;
};

function isColumnPrimaryKey(
	test: Difference,
): test is ColumnPrimaryKeyDifference {
	return (
		test.type === "CHANGE" &&
		test.path[0] === "table" &&
		test.path.length === 4 &&
		test.path[3] === "primaryKey"
	);
}

function columnPrimaryKeyMigrationOperation(diff: ColumnPrimaryKeyDifference) {
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
