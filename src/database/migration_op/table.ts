import { Difference } from "microdiff";
import {
	ColumnsInfo,
	type DbTableInfo,
	type LocalTableInfo,
} from "~/database/introspection/types.js";
import { ChangeSetType } from "~/database/migration_op/changeset.js";
import { executeKyselySchemaStatement } from "./helpers.js";
import { MigrationOpPriority } from "./priority.js";
import { tableColumnsOps } from "./table_common.js";

export function tableMigrationOpGenerator(
	diff: Difference,
	_addedTables: string[],
	_droppedTables: string[],
	_local: LocalTableInfo,
	_db: DbTableInfo,
) {
	if (isCreateTable(diff)) {
		return createTableMigration(diff);
	}
	if (isDropTable(diff)) {
		return dropTableMigration(diff);
	}
}

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

function createTableMigration(diff: CreateTableDiff) {
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

function dropTableMigration(diff: DropTableTableDiff) {
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
