import type { Difference } from "microdiff";
import type { GeneratorContext } from "~pg/changeset/generator-context.js";
import { executeKyselySchemaStatement } from "~pg/changeset/helpers/helpers.js";
import {
	type Changeset,
	ChangesetPhase,
	ChangesetType,
	MigrationOpPriority,
} from "~pg/changeset/types.js";
import { ChangeWarningType } from "~pg/changeset/warnings/change-warning-type.js";
import { ChangeWarningCode } from "~pg/changeset/warnings/codes.js";
import { currentTableName } from "~pg/introspection/introspection/table-name.js";

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
		phase: ChangesetPhase.Alter,
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
		type: ChangesetType.RenameColumn,
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
