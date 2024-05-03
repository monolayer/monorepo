import { Difference } from "microdiff";
import type { GeneratorContext } from "~/changeset/schema-changeset.js";
import {
	ChangeSetType,
	Changeset,
	MigrationOpPriority,
} from "~/changeset/types.js";
import { currentTableName } from "~/introspection/table-name.js";
import { executeKyselySchemaStatement } from "../../../../../changeset/helpers.js";

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
			? [
					executeKyselySchemaStatement(
						schemaName,
						`alterTable("${tableName}")`,
						`alterColumn("${columnName}", (col) => col.dropNotNull())`,
					),
				]
			: [
					executeKyselySchemaStatement(
						schemaName,
						`alterTable("${tableName}")`,
						`alterColumn("${columnName}", (col) => col.setNotNull())`,
					),
				],
		down: diff.value
			? [
					executeKyselySchemaStatement(
						schemaName,
						`alterTable("${tableName}")`,
						`alterColumn("${columnName}", (col) => col.setNotNull())`,
					),
				]
			: [
					executeKyselySchemaStatement(
						schemaName,
						`alterTable("${tableName}")`,
						`alterColumn("${columnName}", (col) => col.dropNotNull())`,
					),
				],
	};
	return changeset;
}
