import type { Difference } from "microdiff";
import {
	ChangeSetType,
	MigrationOpPriority,
	type Changeset,
} from "~/changeset/types.js";
import type {
	DbTableInfo,
	LocalTableInfo,
} from "~/introspection/introspection.js";
import { executeKyselySchemaStatement } from "../../../../../changeset/helpers.js";

export function ColumnNameMigrationOpGenerator(
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
	if (isColumnName(diff)) {
		return columnNameMigrationOperation(diff, schemaName);
	}
}

type ColumnNameDifference = {
	type: "CHANGE";
	path: ["table", string, "columns", string, "columnName"];
	value: string;
	oldValue: string;
};

function isColumnName(test: Difference): test is ColumnNameDifference {
	return (
		test.type === "CHANGE" &&
		test.path[0] === "table" &&
		test.path.length === 5 &&
		test.path[2] === "columns" &&
		test.path[4] === "columnName" &&
		typeof test.value === "string" &&
		typeof test.oldValue === "string"
	);
}

function columnNameMigrationOperation(
	diff: ColumnNameDifference,
	schemaName: string,
) {
	const tableName = diff.path[1];
	const columnName = diff.path[3];
	const changeset: Changeset = {
		priority: MigrationOpPriority.ChangeColumnName,
		tableName: tableName,
		type: ChangeSetType.ChangeColumnName,
		up: [
			executeKyselySchemaStatement(
				schemaName,
				`alterTable("${tableName}")`,
				`renameColumn("${columnName}", "${diff.value}")`,
			),
		],
		down: [
			executeKyselySchemaStatement(
				schemaName,
				`alterTable("${tableName}")`,
				`renameColumn("${diff.value}", "${columnName}")`,
			),
		],
	};
	return changeset;
}
