import { Difference } from "microdiff";
import {
	ChangeSetType,
	Changeset,
} from "~/changeset/migration_op/changeset.js";
import type { DbTableInfo, LocalTableInfo } from "~/introspection/schemas.js";
import { executeKyselySchemaStatement } from "../helpers.js";
import { MigrationOpPriority } from "../priority.js";

export function columnDataTypeMigrationOpGenerator(
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
	if (isColumnDataType(diff)) {
		return columnDatatypeMigrationOperation(diff);
	}
}

type ColumnDataTypeDifference = {
	type: "CHANGE";
	path: ["table", string, string, "dataType"];
	value: string | null;
	oldValue: string | null;
};

function isColumnDataType(test: Difference): test is ColumnDataTypeDifference {
	return (
		test.type === "CHANGE" &&
		test.path[0] === "table" &&
		test.path.length === 4 &&
		test.path[3] === "dataType"
	);
}

function columnDatatypeMigrationOperation(diff: ColumnDataTypeDifference) {
	const tableName = diff.path[1];
	const columnName = diff.path[2];
	const changeset: Changeset = {
		priority: MigrationOpPriority.ChangeColumnDatatype,
		tableName: tableName,
		type: ChangeSetType.ChangeColumn,
		up: [
			executeKyselySchemaStatement(
				`alterTable("${tableName}")`,
				`alterColumn("${columnName}", (col) => col.setDataType("${diff.value}"))`,
			),
		],
		down: [
			executeKyselySchemaStatement(
				`alterTable("${tableName}")`,
				`alterColumn("${columnName}", (col) => col.setDataType("${diff.oldValue}"))`,
			),
		],
	};
	return changeset;
}
