import { Difference } from "microdiff";
import { ChangeSetType, Changeset } from "~/database/changeset.js";
import {
	MigrationOpPriority,
	executeKyselySchemaStatement,
} from "../compute.js";

export type ColumnDefaultDifference = {
	type: "CHANGE";
	path: ["table", string, string, "defaultValue"];
	value: string | boolean | number | null;
	oldValue: string | boolean | number | null;
};

export function isColumnDefaultValue(
	test: Difference,
): test is ColumnDefaultDifference {
	return (
		test.type === "CHANGE" &&
		test.path[0] === "table" &&
		test.path.length === 4 &&
		test.path[3] === "defaultValue"
	);
}

export function columnDefaultMigrationOperation(diff: ColumnDefaultDifference) {
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
						`alterColumn(\"${columnName}\", (col) => col.dropDefault())`,
				  )
				: executeKyselySchemaStatement(
						`alterTable("${tableName}")`,
						`alterColumn(\"${columnName}\", (col) => col.setDefault("${diff.value}"))`,
				  ),
		down:
			diff.value === null
				? executeKyselySchemaStatement(
						`alterTable("${tableName}")`,
						`alterColumn(\"${columnName}\", (col) => col.setDefault("${diff.oldValue}"))`,
				  )
				: executeKyselySchemaStatement(
						`alterTable("${tableName}")`,
						`alterColumn(\"${columnName}\", (col) => col.dropDefault())`,
				  ),
	};
	return changeset;
}
