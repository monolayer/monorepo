import type { Difference } from "microdiff";
import type {
	DbTableInfo,
	LocalTableInfo,
} from "~/database/introspection/types.js";
import { ChangeSetType, type Changeset } from "../changeset.js";
import { executeKyselySchemaStatement } from "../helpers.js";
import { MigrationOpPriority } from "../priority.js";

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
) {
	if (isColumnName(diff)) {
		return columnNameMigrationOperation(diff);
	}
}

type ColumnNameDifference = {
	type: "CHANGE";
	path: ["table", string, string, "columnName"];
	value: string;
	oldValue: string;
};

function isColumnName(test: Difference): test is ColumnNameDifference {
	return (
		test.type === "CHANGE" &&
		test.path[0] === "table" &&
		test.path.length === 4 &&
		test.path[3] === "columnName" &&
		typeof test.value === "string" &&
		typeof test.oldValue === "string"
	);
}

function columnNameMigrationOperation(diff: ColumnNameDifference) {
	const tableName = diff.path[1];
	const columnName = diff.path[2];
	const changeset: Changeset = {
		priority: MigrationOpPriority.ChangeColumnName,
		tableName: tableName,
		type: ChangeSetType.ChangeColumnName,
		up: [
			executeKyselySchemaStatement(
				`alterTable("${tableName}")`,
				`renameColumn("${columnName}", "${diff.value}")`,
			),
		],
		down: [
			executeKyselySchemaStatement(
				`alterTable("${tableName}")`,
				`renameColumn("${diff.value}", "${columnName}")`,
			),
		],
	};
	return changeset;
}
