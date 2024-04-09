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
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	schemaName: string,
) {
	if (isColumnDataType(diff)) {
		return columnDatatypeMigrationOperation(diff, schemaName);
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

function columnDatatypeMigrationOperation(
	diff: ColumnDataTypeDifference,
	schemaName: string,
) {
	const tableName = diff.path[1];
	const columnName = diff.path[2];
	const newDataType = `sql\`${diff.value}\``;
	const oldDataType = `sql\`${diff.oldValue}\``;

	const changeset: Changeset = {
		priority: MigrationOpPriority.ChangeColumnDatatype,
		tableName: tableName,
		type: ChangeSetType.ChangeColumn,
		up: [
			executeKyselySchemaStatement(
				schemaName,
				`alterTable("${tableName}")`,
				`alterColumn("${columnName}", (col) => col.setDataType(${newDataType}))`,
			),
		],
		down: [
			executeKyselySchemaStatement(
				schemaName,
				`alterTable("${tableName}")`,
				`alterColumn("${columnName}", (col) => col.setDataType(${oldDataType}))`,
			),
		],
	};
	return changeset;
}
