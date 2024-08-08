import { Difference } from "microdiff";
import type { GeneratorContext } from "~/changeset/schema-changeset.js";
import {
	ChangeSetType,
	Changeset,
	ChangesetPhase,
	MigrationOpPriority,
} from "~/changeset/types.js";
import type { ChangeWarning } from "~/changeset/warnings.js";
import { ChangeWarningCode } from "~/changeset/warnings/codes.js";
import { ChangeWarningType } from "~/changeset/warnings/types.js";
import { currentTableName } from "~/introspection/table-name.js";
import {
	executeKyselySchemaStatement,
	sqlStatement,
} from "../../../../changeset/helpers.js";
import type { ColumnToAlign } from "../../../alignment.js";
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
		return createNonNullableColumnMigration(diff, context);
	}
	if (isDropColumn(diff)) {
		return dropColumnMigration(diff, context);
	}
}

export type CreateColumnDiff = {
	type: "CREATE";
	path: ["table", string, "column", string];
	value: ColumnInfoDiff;
};

export function isCreateColumn(
	test: Difference,
	// context?: GeneratorContext,
): test is CreateColumnDiff {
	return (
		test.type === "CREATE" &&
		test.path.length === 4 &&
		test.path[0] === "table" &&
		test.path[2] === "columns" &&
		test.value.isNullable !== false
		// (context === undefined
		// 	? true
		// 	: context.splitRefactors.some(
		// 			(splitRefactor) =>
		// 				splitRefactor.schema === context.schemaName &&
		// 				splitRefactor.tableName === test.path[1] &&
		// 				!splitRefactor.targetColumns.includes(
		// 					String(test.value.columnName),
		// 				),
		// 		))
	);
}

function isCreateColumnNonNullableColumn(
	test: Difference,
	// context: GeneratorContext,
): test is CreateColumnDiff {
	return (
		test.type === "CREATE" &&
		test.path.length === 4 &&
		test.path[0] === "table" &&
		test.path[2] === "columns" &&
		test.value.isNullable === false
		// context.splitRefactors.some(
		// 	(splitRefactor) =>
		// 		splitRefactor.schema === context.schemaName &&
		// 		splitRefactor.tableName === test.path[1] &&
		// 		!splitRefactor.targetColumns.includes(String(test.value.columnName)),
		// )
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
		phase: ChangesetPhase.Expand,
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

function createNonNullableColumnMigration(
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
			`addColumn("${columnName}", ${compileDataType(columnDef.dataType)}${nullableColumnOptions(columnDef)})`,
		),
	];

	if (columnDef.defaultValue !== null) {
		const defaultValueAndHash = toValueAndHash(String(columnDef.defaultValue));

		up.push(
			commentForDefault(schemaName, tableName, columnName, defaultValueAndHash),
		);
	}

	if (columnDef.dataType !== "serial" && columnDef.dataType !== "bigserial") {
		up.push(...setNotNullOp(schemaName, tableName, columnName));
	}

	const down = [
		executeKyselySchemaStatement(
			schemaName,
			`alterTable("${tableName}")`,
			`dropColumn("${columnName}")`,
		),
	];

	const changeset: Changeset = {
		priority: MigrationOpPriority.ColumnCreate,
		phase: ChangesetPhase.Expand,
		tableName: tableName,
		currentTableName: currentTableName(tableName, tablesToRename, schemaName),
		type: ChangeSetType.CreateNonNullableColumn,
		up,
		down,
		schemaName,
	};
	addWarnings(changeset, columnDef, schemaName, tableName, columnName);
	return changeset;
}

export type DropColumnDiff = {
	type: "REMOVE";
	path: ["table", string, "columns", string];
	oldValue: ColumnInfoDiff;
};

export function isDropColumn(test: Difference): test is DropColumnDiff {
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
		phase: ChangesetPhase.Contract,
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
	const warnings: ChangeWarning[] = [];

	if (columnDef.dataType === "serial" || columnDef.dataType === "bigserial") {
		warnings.push({
			type: ChangeWarningType.Blocking,
			code:
				columnDef.dataType === "serial"
					? ChangeWarningCode.AddSerialColumn
					: ChangeWarningCode.AddBigSerialColumn,
			schema: schemaName,
			table: tableName,
			column: columnName,
		});
	}

	if (columnDef.volatileDefault === "yes") {
		warnings.push({
			type: ChangeWarningType.Blocking,
			code: ChangeWarningCode.AddVolatileDefault,
			schema: schemaName,
			table: tableName,
			column: columnName,
		});
	}
	if (columnDef.isNullable === false) {
		warnings.push({
			type: ChangeWarningType.MightFail,
			code: ChangeWarningCode.AddNonNullableColumn,
			schema: schemaName,
			table: tableName,
			column: columnName,
		});
	}
	if (warnings.length > 0) {
		changeset.warnings = warnings;
	}
}

function nullableColumnOptions(column: ColumnToAlign | ColumnInfoDiff) {
	let columnOptions = "";
	const options = [];

	if (column.defaultValue !== null) {
		const defaultValueAndHash = toValueAndHash(String(column.defaultValue));

		options.push(`defaultTo(${sqlStatement(defaultValueAndHash.value ?? "")})`);
	}
	switch (column.identity) {
		case "ALWAYS":
			options.push(`generatedAlwaysAsIdentity()`);
			break;
		case "BY DEFAULT":
			options.push(`generatedByDefaultAsIdentity()`);
			break;
		default:
			break;
	}

	if (options.length !== 0)
		columnOptions = `, (col) => col.${options.join(".")}`;
	return columnOptions;
}
