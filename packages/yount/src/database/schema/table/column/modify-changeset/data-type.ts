import { Difference } from "microdiff";
import type { GeneratorContext } from "~/changeset/schema-changeset.js";
import {
	ChangeSetType,
	Changeset,
	MigrationOpPriority,
} from "~/changeset/types.js";
import { executeKyselySchemaStatement } from "../../../../../changeset/helpers.js";

export function columnDataTypeMigrationOpGenerator(
	diff: Difference,
	context: GeneratorContext,
) {
	if (isColumnDataType(diff)) {
		return columnDatatypeMigrationOperation(diff, context);
	}
}

type ColumnDataTypeDifference = {
	type: "CHANGE";
	path: ["table", string, "columns", string, "dataType"];
	value: string | null;
	oldValue: string | null;
};

function isColumnDataType(test: Difference): test is ColumnDataTypeDifference {
	return (
		test.type === "CHANGE" &&
		test.path[0] === "table" &&
		test.path.length === 5 &&
		test.path[2] === "columns" &&
		test.path[4] === "dataType"
	);
}

function columnDatatypeMigrationOperation(
	diff: ColumnDataTypeDifference,
	{ schemaName }: GeneratorContext,
) {
	const tableName = diff.path[1];
	const columnName = diff.path[3];
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
		schemaName,
	};
	return changeset;
}
