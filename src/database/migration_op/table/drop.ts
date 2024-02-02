import { Difference } from "microdiff";
import { ChangeSetType } from "~/database/changeset.js";
import { ColumnsInfo } from "~/database/introspection/types.js";
import {
	MigrationOpPriority,
	executeKyselySchemaStatement,
} from "../migration_op.js";
import { tableColumnsOps } from "../table_common.js";

export type DropTableTableDiff = {
	type: "REMOVE";
	path: ["table", string];
	oldValue: ColumnsInfo;
};

export function isDropTable(test: Difference): test is DropTableTableDiff {
	return (
		test.type === "REMOVE" && test.path.length === 2 && test.path[0] === "table"
	);
}

export function dropTableMigration(diff: DropTableTableDiff) {
	const tableName = diff.path[1];
	return {
		priority: MigrationOpPriority.Table,
		tableName: tableName,
		type: ChangeSetType.DropTable,
		up: executeKyselySchemaStatement(`dropTable("${tableName}")`),
		down: executeKyselySchemaStatement(
			`createTable("${tableName}")`,
			...tableColumnsOps(diff.oldValue),
		),
	};
}
