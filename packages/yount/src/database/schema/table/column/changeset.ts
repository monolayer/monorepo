import { Difference } from "microdiff";
import {
	ChangeSetType,
	Changeset,
	MigrationOpPriority,
} from "~/changeset/types.js";
import {
	executeKyselyDbStatement,
	executeKyselySchemaStatement,
} from "../../../../changeset/helpers.js";
import type {
	DbTableInfo,
	LocalTableInfo,
} from "../../../../introspection/introspection.js";
import {
	compileDataType,
	optionsForColumn,
	toValueAndHash,
	type ColumnInfoDiff,
} from "../changeset-helpers.js";

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
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	schemaName: string,
) {
	if (isCreateColumn(diff)) {
		return createColumnMigration(diff, schemaName);
	}
	if (isDropColumn(diff)) {
		return dropColumnMigration(diff, schemaName);
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

function createColumnMigration(diff: CreateColumnDiff, schemaName: string) {
	const tableName = diff.path[1];
	const columnName = diff.path[2];
	const columnDef = diff.value;

	const up = [
		executeKyselySchemaStatement(
			schemaName,
			`alterTable("${tableName}")`,
			`addColumn("${columnName}", ${compileDataType(
				columnDef.dataType,
				columnDef.enum,
			)}${optionsForColumn(columnDef)})`,
		),
	];
	const defaultValueAndHash = toValueAndHash(String(columnDef.defaultValue));

	if (columnDef.defaultValue !== null) {
		up.push(
			executeKyselyDbStatement(
				`COMMENT ON COLUMN "${schemaName}"."${tableName}"."${columnName}" IS '${defaultValueAndHash.hash}'`,
			),
		);
	}
	const changeset: Changeset = {
		priority: MigrationOpPriority.ColumnCreate,
		tableName: tableName,
		type: ChangeSetType.CreateColumn,
		up: up,
		down: [
			executeKyselySchemaStatement(
				schemaName,
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

function dropColumnMigration(diff: DropColumnDiff, schemaName: string) {
	const tableName = diff.path[1];
	const columnDef = diff.oldValue;
	const columnName = diff.path[2];

	const down = [
		executeKyselySchemaStatement(
			schemaName,
			`alterTable("${tableName}")`,
			`addColumn("${columnName}", ${compileDataType(
				columnDef.dataType,
				columnDef.enum,
			)}${optionsForColumn(columnDef)})`,
		),
	];
	if (columnDef.defaultValue !== null) {
		const defaultValueAndHash = toValueAndHash(String(columnDef.defaultValue));
		down.push(
			executeKyselyDbStatement(
				`COMMENT ON COLUMN "${schemaName}"."${tableName}"."${columnName}" IS '${defaultValueAndHash.hash}'`,
			),
		);
	}
	const changeset: Changeset = {
		priority: MigrationOpPriority.ColumnDrop,
		tableName: tableName,
		type: ChangeSetType.DropColumn,
		up: [
			executeKyselySchemaStatement(
				schemaName,
				`alterTable("${tableName}")`,
				`dropColumn("${columnName}")`,
			),
		],
		down: down,
	};
	return changeset;
}
