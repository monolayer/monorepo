import { Difference } from "microdiff";
import type { GeneratorContext } from "~/changeset/schema-changeset.js";
import {
	ChangeSetType,
	MigrationOpPriority,
	type Changeset,
} from "~/changeset/types.js";
import {
	executeKyselyDbStatement,
	executeKyselySchemaStatement,
} from "../../../changeset/helpers.js";
import {
	tableColumnsOps,
	toValueAndHash,
	type ColumnsInfoDiff,
} from "./changeset-helpers.js";

export function tableMigrationOpGenerator(
	diff: Difference,
	context: GeneratorContext,
) {
	if (isCreateTable(diff)) {
		return createTableMigration(diff, context);
	}
	if (isDropTable(diff)) {
		return dropTableMigration(diff, context);
	}
}

export type CreateTableDiff = {
	type: "CREATE";
	path: ["table", string];
	value: { columns: ColumnsInfoDiff };
};

export function isCreateTable(test: Difference): test is CreateTableDiff {
	return (
		test.type === "CREATE" && test.path.length === 2 && test.path[0] === "table"
	);
}

function createTableMigration(
	diff: CreateTableDiff,
	{ schemaName }: GeneratorContext,
) {
	const tableName = diff.path[1];
	const up = [
		executeKyselySchemaStatement(
			schemaName,
			`createTable("${tableName}")`,
			...tableColumnsOps(diff.value.columns),
		),
	];

	Object.entries(diff.value.columns).flatMap(([, column]) => {
		if (column.defaultValue !== null) {
			const valueAndHash = toValueAndHash(column.defaultValue);
			up.push(
				executeKyselyDbStatement(
					`COMMENT ON COLUMN "${schemaName}"."${tableName}"."${column.columnName}" IS '${valueAndHash.hash}'`,
				),
			);
		}
	});

	const changeset: Changeset = {
		priority: MigrationOpPriority.TableCreate,
		tableName: tableName,
		type: ChangeSetType.CreateTable,
		up: up,
		down: [
			executeKyselySchemaStatement(schemaName, `dropTable("${tableName}")`),
		],
	};
	return changeset;
}

export type DropTableTableDiff = {
	type: "REMOVE";
	path: ["table", string];
	oldValue: { columns: ColumnsInfoDiff };
};

export function isDropTable(test: Difference): test is DropTableTableDiff {
	return (
		test.type === "REMOVE" && test.path.length === 2 && test.path[0] === "table"
	);
}

function dropTableMigration(
	diff: DropTableTableDiff,
	{ schemaName }: GeneratorContext,
) {
	const tableName = diff.path[1];
	const down = [
		executeKyselySchemaStatement(
			schemaName,
			`createTable("${tableName}")`,
			...tableColumnsOps(diff.oldValue.columns),
		),
	];

	Object.entries(diff.oldValue.columns).flatMap(([, column]) => {
		if (column.defaultValue !== null) {
			const valueAndHash = toValueAndHash(column.defaultValue);
			down.push(
				executeKyselyDbStatement(
					`COMMENT ON COLUMN "${schemaName}"."${tableName}"."${column.columnName}" IS '${valueAndHash.hash}'`,
				),
			);
		}
	});

	const changeset: Changeset = {
		priority: MigrationOpPriority.TableDrop,
		tableName: tableName,
		type: ChangeSetType.DropTable,
		up: [executeKyselySchemaStatement(schemaName, `dropTable("${tableName}")`)],
		down: down,
	};
	return changeset;
}
