import { Difference } from "microdiff";
import {
	ChangeSetType,
	Changeset,
} from "~/changeset/migration-op/changeset.js";
import type {
	DbTableInfo,
	LocalTableInfo,
} from "../../introspection/schemas.js";
import { executeKyselySchemaStatement } from "./helpers.js";
import { MigrationOpPriority } from "./priority.js";
import {
	compileDataType,
	optionsForColumn,
	toValueAndHash,
	type ColumnInfoDiff,
} from "./table-common.js";

export function columnMigrationOpGenerator(
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
	if (isCreateColumn(diff)) {
		return createColumnMigration(diff);
	}
	if (isDropColumn(diff)) {
		return dropColumnMigration(diff);
	}
}

type CreateColumnDiff = {
	type: "CREATE";
	path: ["table", string, string];
	value: ColumnInfoDiff;
};

function isCreateColumn(test: Difference): test is CreateColumnDiff {
	return (
		test.type === "CREATE" && test.path.length === 3 && test.path[0] === "table"
	);
}

function createColumnMigration(diff: CreateColumnDiff) {
	const tableName = diff.path[1];
	const columnName = diff.path[2];
	const columnDef = diff.value;

	const up = [
		executeKyselySchemaStatement(
			`alterTable("${tableName}")`,
			`addColumn("${columnName}", ${compileDataType(
				columnDef.dataType,
				columnDef.enum,
			)}${optionsForColumn(columnDef)})`,
		),
	];
	const defaultValueAndHash = toValueAndHash(String(columnDef.defaultValue));

	if (columnDef.defaultValue !== null) {
		up.push([
			`await sql\`COMMENT ON COLUMN "${tableName}"."${columnName}" IS '${defaultValueAndHash.hash}'\`.execute(db);`,
		]);
	}
	const changeset: Changeset = {
		priority: MigrationOpPriority.ColumnCreate,
		tableName: tableName,
		type: ChangeSetType.CreateColumn,
		up: up,
		down: [
			executeKyselySchemaStatement(
				`alterTable("${tableName}")`,
				`dropColumn("${columnName}")`,
			),
		],
	};
	return changeset;
}

type DropColumnDiff = {
	type: "REMOVE";
	path: ["table", string, string];
	oldValue: ColumnInfoDiff;
};

function isDropColumn(test: Difference): test is DropColumnDiff {
	return (
		test.type === "REMOVE" && test.path.length === 3 && test.path[0] === "table"
	);
}

function dropColumnMigration(diff: DropColumnDiff) {
	const tableName = diff.path[1];
	const columnDef = diff.oldValue;
	const columnName = diff.path[2];

	const down = [
		executeKyselySchemaStatement(
			`alterTable("${tableName}")`,
			`addColumn("${columnName}", ${compileDataType(
				columnDef.dataType,
				columnDef.enum,
			)}${optionsForColumn(columnDef)})`,
		),
	];
	if (columnDef.defaultValue !== null) {
		const defaultValueAndHash = toValueAndHash(String(columnDef.defaultValue));
		down.push([
			`await sql\`COMMENT ON COLUMN "${tableName}"."${columnName}" IS '${defaultValueAndHash.hash}'\`.execute(db);`,
		]);
	}
	const changeset: Changeset = {
		priority: MigrationOpPriority.ColumnDrop,
		tableName: tableName,
		type: ChangeSetType.DropColumn,
		up: [
			executeKyselySchemaStatement(
				`alterTable("${tableName}")`,
				`dropColumn("${columnName}")`,
			),
		],
		down: down,
	};
	return changeset;
}
