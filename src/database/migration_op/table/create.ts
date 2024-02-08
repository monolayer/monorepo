import { Difference } from "microdiff";
import { ColumnsInfo } from "~/database/introspection/types.js";
import { ChangeSetType } from "~/database/migration_op/changeset.js";
import { executeKyselySchemaStatement } from "../helpers.js";
import { MigrationOpPriority } from "../priority.js";
import { tableColumnsOps } from "../table_common.js";

export type CreateTableDiff = {
	type: "CREATE";
	path: ["table", string];
	value: ColumnsInfo;
};

export function isCreateTable(test: Difference): test is CreateTableDiff {
	return (
		test.type === "CREATE" && test.path.length === 2 && test.path[0] === "table"
	);
}

export function createTableMigration(diff: CreateTableDiff) {
	const tableName = diff.path[1];
	return {
		priority: MigrationOpPriority.Table,
		tableName: tableName,
		type: ChangeSetType.CreateTable,
		up: executeKyselySchemaStatement(
			`createTable("${tableName}")`,
			...tableColumnsOps(diff.value),
		),
		down: executeKyselySchemaStatement(`dropTable("${tableName}")`),
	};
}
