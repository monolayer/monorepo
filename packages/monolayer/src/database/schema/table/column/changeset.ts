/* eslint-disable max-lines */
import { Difference } from "microdiff";
import type { GeneratorContext } from "~/changeset/schema-changeset.js";
import {
	ChangeSetType,
	Changeset,
	MigrationOpPriority,
} from "~/changeset/types.js";
import { ChangeWarningCode, ChangeWarningType } from "~/changeset/warnings.js";
import { currentTableName } from "~/introspection/table-name.js";
import {
	executeKyselyDbStatement,
	executeKyselySchemaStatement,
	sqlStatement,
} from "../../../../changeset/helpers.js";
import {
	commentForDefault,
	compileDataType,
	optionsForColumn,
	toValueAndHash,
	type ColumnInfoDiff,
} from "../changeset-helpers.js";
import { setNotNullOp } from "./modify-changeset/nullable.js";

export function columnMigrationOpGenerator(
	diff: Difference,
	context: GeneratorContext,
) {
	if (isCreateColumn(diff)) {
		return createColumnMigration(diff, context);
	}
	if (isCreateColumnNonNullableColumn(diff)) {
		return createNullableColumnMigration(diff, context);
	}
	if (isDropColumn(diff)) {
		return dropColumnMigration(diff, context);
	}
}

type CreateColumnDiff = {
	type: "CREATE";
	path: ["table", string, "column", string];
	value: ColumnInfoDiff;
};

function isCreateColumn(test: Difference): test is CreateColumnDiff {
	return (
		test.type === "CREATE" &&
		test.path.length === 4 &&
		test.path[0] === "table" &&
		test.path[2] === "columns" &&
		test.value.isNullable !== false
	);
}

function isCreateColumnNonNullableColumn(
	test: Difference,
): test is CreateColumnDiff {
	return (
		test.type === "CREATE" &&
		test.path.length === 4 &&
		test.path[0] === "table" &&
		test.path[2] === "columns" &&
		test.value.isNullable === false
	);
}

function createColumnMigration(
	diff: CreateColumnDiff,
	{ schemaName, tablesToRename }: GeneratorContext,
) {
	const tableName = diff.path[1];
	const columnName = diff.path[3];
	const columnDef = diff.value;

	const up = [
		executeKyselySchemaStatement(
			schemaName,
			`alterTable("${tableName}")`,
			`addColumn("${columnName}", ${compileDataType(
				columnDef.dataType,
			)}${optionsForColumn(columnDef)})`,
		),
	];
	const defaultValueAndHash = toValueAndHash(String(columnDef.defaultValue));

	if (columnDef.defaultValue !== null) {
		up.push(
			commentForDefault(schemaName, tableName, columnName, defaultValueAndHash),
		);
	}
	const changeset: Changeset = {
		priority: MigrationOpPriority.ColumnCreate,
		tableName: tableName,
		currentTableName: currentTableName(tableName, tablesToRename, schemaName),
		type: ChangeSetType.CreateColumn,
		up: up,
		down: [
			executeKyselySchemaStatement(
				schemaName,
				`alterTable("${tableName}")`,
				`dropColumn("${columnName}")`,
			),
		],
		schemaName,
	};
	addWarnings(changeset, columnDef, schemaName, tableName, columnName);
	return changeset;
}

function createNullableColumnMigration(
	diff: CreateColumnDiff,
	{ schemaName, tablesToRename }: GeneratorContext,
) {
	const tableName = diff.path[1];
	const columnName = diff.path[3];
	const columnDef = diff.value;

	const up = [
		executeKyselySchemaStatement(
			schemaName,
			`alterTable("${tableName}")`,
			`addColumn("${columnName}", ${compileDataType(columnDef.dataType)})`,
		),
		...(columnDef.dataType !== "serial" && columnDef.dataType !== "bigserial"
			? setNotNullOp(schemaName, tableName, columnName)
			: []),
	];

	const down = [
		executeKyselySchemaStatement(
			schemaName,
			`alterTable("${tableName}")`,
			`dropColumn("${columnName}")`,
		),
	];

	switch (columnDef.identity) {
		case "ALWAYS":
			up.push(
				executeKyselyDbStatement(
					`ALTER TABLE "${schemaName}"."${tableName}" ALTER COLUMN "${columnName}" ADD GENERATED ALWAYS AS IDENTITY`,
				),
			);
			break;
		case "BY DEFAULT":
			up.push(
				executeKyselyDbStatement(
					`ALTER TABLE "${schemaName}"."${tableName}" ALTER COLUMN "${columnName}" ADD GENERATED BY DEFAULT AS IDENTITY`,
				),
			);
			break;
		default:
			break;
	}

	if (columnDef.defaultValue !== null) {
		const defaultValueAndHash = toValueAndHash(String(columnDef.defaultValue));

		up.push(
			executeKyselySchemaStatement(
				schemaName,
				`alterTable("${tableName}")`,
				`alterColumn("${columnName}", (col) => col.setDefault(${sqlStatement(defaultValueAndHash.value ?? "")}))`,
			),
		);

		up.push(
			commentForDefault(schemaName, tableName, columnName, defaultValueAndHash),
		);
	}
	const changeset: Changeset = {
		priority: MigrationOpPriority.ColumnCreate,
		tableName: tableName,
		currentTableName: currentTableName(tableName, tablesToRename, schemaName),
		type: ChangeSetType.CreateColumn,
		up,
		down,
		schemaName,
	};
	addWarnings(changeset, columnDef, schemaName, tableName, columnName);
	return changeset;
}

type DropColumnDiff = {
	type: "REMOVE";
	path: ["table", string, "columns", string];
	oldValue: ColumnInfoDiff;
};

function isDropColumn(test: Difference): test is DropColumnDiff {
	return (
		test.type === "REMOVE" &&
		test.path.length === 4 &&
		test.path[0] === "table" &&
		test.path[2] === "columns"
	);
}

function dropColumnMigration(
	diff: DropColumnDiff,
	{ schemaName, tablesToRename }: GeneratorContext,
) {
	const tableName = diff.path[1];
	const columnDef = diff.oldValue;
	const columnName = diff.path[3];

	const down = [
		executeKyselySchemaStatement(
			schemaName,
			`alterTable("${tableName}")`,
			`addColumn("${columnName}", ${compileDataType(
				columnDef.dataType,
			)}${optionsForColumn(columnDef)})`,
		),
	];
	if (columnDef.defaultValue !== null) {
		const defaultValueAndHash = toValueAndHash(String(columnDef.defaultValue));
		down.push(
			commentForDefault(schemaName, tableName, columnName, defaultValueAndHash),
		);
	}
	const changeset: Changeset = {
		priority: MigrationOpPriority.ColumnDrop,
		tableName: tableName,
		currentTableName: currentTableName(tableName, tablesToRename, schemaName),
		type: ChangeSetType.DropColumn,
		warnings: [
			{
				type: ChangeWarningType.Destructive,
				code: ChangeWarningCode.ColumnDrop,
				schema: schemaName,
				table: currentTableName(tableName, tablesToRename, schemaName),
				column: columnName,
			},
		],
		up: [
			executeKyselySchemaStatement(
				schemaName,
				`alterTable("${tableName}")`,
				`dropColumn("${columnName}")`,
			),
		],
		down: down,
		schemaName,
	};
	return changeset;
}

function addWarnings(
	changeset: Changeset,
	columnDef: ColumnInfoDiff,
	schemaName: string,
	tableName: string,
	columnName: string,
) {
	if (columnDef.dataType === "serial" || columnDef.dataType === "bigserial") {
		changeset.warnings = [
			{
				type: ChangeWarningType.Blocking,
				code:
					columnDef.dataType === "serial"
						? ChangeWarningCode.AddSerialColumn
						: ChangeWarningCode.AddBigSerialColumn,
				schema: schemaName,
				table: tableName,
				column: columnName,
			},
		];
	}

	if (columnDef.volatileDefault === "yes") {
		changeset.warnings = [
			{
				type: ChangeWarningType.Blocking,
				code: ChangeWarningCode.AddVolatileDefault,
				schema: schemaName,
				table: tableName,
				column: columnName,
			},
		];
	}
}
