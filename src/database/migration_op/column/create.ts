import { Difference } from "microdiff";
import { ChangeSetType, Changeset } from "~/database/changeset.js";
import { ColumnInfo } from "~/database/introspection/types.js";
import {
	MigrationOpPriority,
	executeKyselySchemaStatement,
} from "../migration_op.js";
import { foreignKeyConstraint, optionsForColumn } from "../table_common.js";

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
