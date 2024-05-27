import type { Difference } from "microdiff";
import type { GeneratorContext } from "~/changeset/schema-changeset.js";
import {
	ChangeSetType,
	MigrationOpPriority,
	type Changeset,
} from "~/changeset/types.js";
import { ChangeWarningCode } from "~/changeset/warnings/codes.js";
import { ChangeWarningType } from "~/changeset/warnings/types.js";
import { currentTableName } from "~/introspection/table-name.js";
import { executeKyselySchemaStatement } from "../../../../../changeset/helpers.js";

export function ColumnNameMigrationOpGenerator(
	diff: Difference,
	context: GeneratorContext,
) {
	if (isColumnName(diff)) {
		return columnNameMigrationOperation(diff, context);
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
	{ schemaName, tablesToRename }: GeneratorContext,
) {
	const tableName = diff.path[1];
	const changeset: Changeset = {
		priority: MigrationOpPriority.ChangeColumnName,
		schemaName,
		tableName: tableName,
		currentTableName: currentTableName(tableName, tablesToRename, schemaName),
		warnings: [
			{
				type: ChangeWarningType.BackwardIncompatible,
				code: ChangeWarningCode.ColumnRename,
				schema: schemaName,
				table: currentTableName(tableName, tablesToRename, schemaName),
				columnRename: {
					from: diff.oldValue,
					to: diff.value,
				},
			},
		],
		type: ChangeSetType.RenameColumn,
		up: [
			executeKyselySchemaStatement(
				schemaName,
				`alterTable("${tableName}")`,
				`renameColumn("${diff.oldValue}", "${diff.value}")`,
			),
		],
		down: [
			executeKyselySchemaStatement(
				schemaName,
				`alterTable("${tableName}")`,
				`renameColumn("${diff.value}", "${diff.oldValue}")`,
			),
		],
	};
	return changeset;
}
