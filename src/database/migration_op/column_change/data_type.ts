import { Difference } from "microdiff";
import { ChangeSetType, Changeset } from "~/database/changeset.js";
import {
	MigrationOpPriority,
	executeKyselySchemaStatement,
} from "../migration_op.js";

export type ColumnDataTypeDifference = {
	type: "CHANGE";
	path: ["table", string, string, "dataType"];
	value: string | null;
	oldValue: string | null;
};

export function isColumnDataType(
	test: Difference,
): test is ColumnDataTypeDifference {
	return (
		test.type === "CHANGE" &&
		test.path[0] === "table" &&
		test.path.length === 4 &&
		test.path[3] === "dataType"
	);
}

export function columnDatatypeMigrationOperation(
	diff: ColumnDataTypeDifference,
) {
	const tableName = diff.path[1];
	const columnName = diff.path[2];
	const changeset: Changeset = {
		priority: MigrationOpPriority.ChangeColumnDatatype,
		tableName: tableName,
		type: ChangeSetType.ChangeColumn,
		up: executeKyselySchemaStatement(
			`alterTable("${tableName}")`,
			`alterColumn(\"${columnName}\", (col) => col.setDataType("${diff.value}"))`,
		),
		down: executeKyselySchemaStatement(
			`alterTable("${tableName}")`,
			`alterColumn(\"${columnName}\", (col) => col.setDataType("${diff.oldValue}"))`,
		),
	};
	return changeset;
}
