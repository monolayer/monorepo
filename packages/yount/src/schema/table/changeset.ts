import { Difference } from "microdiff";
import {
	ChangeSetType,
	MigrationOpPriority,
	type Changeset,
} from "~/changeset/types.js";
import {
	executeKyselyDbStatement,
	executeKyselySchemaStatement,
} from "../../changeset/helpers.js";
import {
	type DbTableInfo,
	type LocalTableInfo,
} from "../../introspection/introspection.js";
import {
	tableColumnsOps,
	toValueAndHash,
	type ColumnsInfoDiff,
} from "./changeset-helpers.js";

export function tableMigrationOpGenerator(
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
	_schemaName: string,
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
	value: ColumnsInfoDiff;
};

export function isCreateTable(test: Difference): test is CreateTableDiff {
	return (
		test.type === "CREATE" && test.path.length === 2 && test.path[0] === "table"
	);
}

function createTableMigration(diff: CreateTableDiff) {
	const tableName = diff.path[1];
	const up = [
		executeKyselySchemaStatement(
			`createTable("${tableName}")`,
			...tableColumnsOps(diff.value),
		),
	];

	Object.entries(diff.value).flatMap(([, column]) => {
		if (column.defaultValue !== null) {
			const valueAndHash = toValueAndHash(column.defaultValue);
			up.push(
				executeKyselyDbStatement(
					`COMMENT ON COLUMN "${column.tableName}"."${column.columnName}" IS '${valueAndHash.hash}'`,
				),
			);
		}
	});

	const changeset: Changeset = {
		priority: MigrationOpPriority.TableCreate,
		tableName: tableName,
		type: ChangeSetType.CreateTable,
		up: up,
		down: [executeKyselySchemaStatement(`dropTable("${tableName}")`)],
	};
	return changeset;
}

export type DropTableTableDiff = {
	type: "REMOVE";
	path: ["table", string];
	oldValue: ColumnsInfoDiff;
};

export function isDropTable(test: Difference): test is DropTableTableDiff {
	return (
		test.type === "REMOVE" && test.path.length === 2 && test.path[0] === "table"
	);
}

function dropTableMigration(diff: DropTableTableDiff) {
	const tableName = diff.path[1];
	const down = [
		executeKyselySchemaStatement(
			`createTable("${tableName}")`,
			...tableColumnsOps(diff.oldValue),
		),
	];

	Object.entries(diff.oldValue).flatMap(([, column]) => {
		if (column.defaultValue !== null) {
			const valueAndHash = toValueAndHash(column.defaultValue);
			down.push(
				executeKyselyDbStatement(
					`COMMENT ON COLUMN "${column.tableName}"."${column.columnName}" IS '${valueAndHash.hash}'`,
				),
			);
		}
	});

	const changeset: Changeset = {
		priority: MigrationOpPriority.TableDrop,
		tableName: tableName,
		type: ChangeSetType.DropTable,
		up: [executeKyselySchemaStatement(`dropTable("${tableName}")`)],
		down: down,
	};
	return changeset;
}
