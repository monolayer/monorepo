import { Difference } from "microdiff";
import type { GeneratorContext } from "~/changeset/schema-changeset.js";
import {
	ChangeSetType,
	Changeset,
	MigrationOpPriority,
} from "~/changeset/types.js";
import { ChangeWarningCode } from "~/changeset/warnings/codes.js";
import { ChangeWarningType } from "~/changeset/warnings/types.js";
import { currentTableName } from "~/introspection/table-name.js";
import { executeKyselySchemaStatement } from "../../../../../changeset/helpers.js";
import {
	addCheckWithSchemaStatements,
	dropCheckKyselySchemaStatement,
} from "../../constraints/check/changeset.js";

export function columnNullableMigrationOpGenerator(
	diff: Difference,
	context: GeneratorContext,
) {
	if (isColumnNullable(diff)) {
		return columnNullableMigrationOperation(diff, context);
	}
}

type ColumnNullableDifference = {
	type: "CHANGE";
	path: ["table", string, "columns", string, "isNullable"];
	value: boolean;
	oldValue: boolean;
};

function isColumnNullable(test: Difference): test is ColumnNullableDifference {
	return (
		test.type === "CHANGE" &&
		test.path[0] === "table" &&
		test.path.length === 5 &&
		test.path[2] === "columns" &&
		test.path[4] === "isNullable"
	);
}

function columnNullableMigrationOperation(
	diff: ColumnNullableDifference,
	{ schemaName, tablesToRename }: GeneratorContext,
) {
	const tableName = diff.path[1];
	const columnName = diff.path[3];
	const changeset: Changeset = {
		priority: MigrationOpPriority.ChangeColumnNullable,
		schemaName,
		tableName: tableName,
		currentTableName: currentTableName(tableName, tablesToRename, schemaName),
		type: ChangeSetType.ChangeColumn,
		up: diff.value
			? [dropNotNullOp(schemaName, tableName, columnName)]
			: setNotNullOp(schemaName, tableName, columnName),
		down: diff.value
			? setNotNullOp(schemaName, tableName, columnName)
			: [dropNotNullOp(schemaName, tableName, columnName)],
	};
	if (diff.value === false) {
		changeset.warnings = [
			{
				type: ChangeWarningType.MightFail,
				code: ChangeWarningCode.ChangeColumnToNonNullable,
				schema: schemaName,
				table: tableName,
				column: columnName,
			},
		];
	}
	return changeset;
}

export function setNotNullOp(
	schemaName: string,
	tableName: string,
	columnName: string,
) {
	return [
		...addCheckWithSchemaStatements(schemaName, tableName, {
			name: "temporary_not_null_check_constraint",
			definition: `"${columnName}" IS NOT NULL`,
		}),
		executeKyselySchemaStatement(
			schemaName,
			`alterTable("${tableName}")`,
			`alterColumn("${columnName}", (col) => col.setNotNull())`,
		),
		dropCheckKyselySchemaStatement(
			schemaName,
			tableName,
			"temporary_not_null_check_constraint",
		),
	];
}

function dropNotNullOp(
	schemaName: string,
	tableName: string,
	columnName: string,
) {
	return executeKyselySchemaStatement(
		schemaName,
		`alterTable("${tableName}")`,
		`alterColumn("${columnName}", (col) => col.dropNotNull())`,
	);
}
