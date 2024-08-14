import { Difference } from "microdiff";
import type { GeneratorContext } from "~pg/changeset/generator-context.js";
import {
	commentForDefault,
	toValueAndHash,
} from "~pg/changeset/generators/helpers.js";
import {
	executeKyselySchemaStatement,
	sqlStatement,
} from "~pg/changeset/helpers/helpers.js";
import {
	type Changeset,
	ChangesetPhase,
	ChangeSetType,
	MigrationOpPriority,
} from "~pg/changeset/types.js";
import { ChangeWarningType } from "~pg/changeset/warnings/change-warning-type.js";
import { ChangeWarningCode } from "~pg/changeset/warnings/codes.js";
import { currentTableName } from "~pg/introspection/introspection/table-name.js";
import type { SchemaMigrationInfo } from "~pg/schema/column/types.js";

export function columnDefaultMigrationOpGenerator(
	diff: Difference,
	context: GeneratorContext,
) {
	if (isColumnDefaultAddValue(diff)) {
		return columnDefaultAddMigrationOperation(diff, context);
	}
	if (isColumnDefaultDropValue(diff)) {
		return columnDefaultDropMigrationOperation(diff, context);
	}
	if (isColumnDefaultChangeValue(diff)) {
		return columnDefaultChangeMigrationOperation(diff, context);
	}
}

type ColumnDefaultAddDifference = {
	type: "CHANGE";
	path: ["table", string, "columns", string, "defaultValue"];
	value: string;
	oldValue: null;
};

type ColumnDefaultDropDifference = {
	type: "CHANGE";
	path: ["table", string, "columns", string, "defaultValue"];
	value: null;
	oldValue: string;
};

type ColumnDefaultChangeDifference = {
	type: "CHANGE";
	path: ["table", string, "columns", string, "defaultValue"];
	value: string;
	oldValue: string;
};

function isColumnDefaultAddValue(
	test: Difference,
): test is ColumnDefaultAddDifference {
	return (
		test.type === "CHANGE" &&
		test.path[0] === "table" &&
		test.path.length === 5 &&
		test.path[2] === "columns" &&
		test.path[4] === "defaultValue" &&
		test.value !== null &&
		test.oldValue === null
	);
}

function isColumnDefaultDropValue(
	test: Difference,
): test is ColumnDefaultDropDifference {
	return (
		test.type === "CHANGE" &&
		test.path[0] === "table" &&
		test.path.length === 5 &&
		test.path[2] === "columns" &&
		test.path[4] === "defaultValue" &&
		test.value === null &&
		test.oldValue !== null
	);
}

function isColumnDefaultChangeValue(
	test: Difference,
): test is ColumnDefaultChangeDifference {
	return (
		test.type === "CHANGE" &&
		test.path[0] === "table" &&
		test.path.length === 5 &&
		test.path[2] === "columns" &&
		test.path[4] === "defaultValue" &&
		test.value !== null &&
		test.oldValue !== null
	);
}

function columnDefaultAddMigrationOperation(
	diff: ColumnDefaultAddDifference,
	{ schemaName, tablesToRename }: GeneratorContext,
) {
	const tableName = diff.path[1];
	const columnName = diff.path[3];

	const defaultValueAndHash = toValueAndHash(String(diff.value));

	const changeset: Changeset = {
		priority: MigrationOpPriority.ChangeColumnDefaultAdd,
		phase: ChangesetPhase.Alter,
		tableName: tableName,
		currentTableName: currentTableName(tableName, tablesToRename, schemaName),
		type: ChangeSetType.ChangeColumnDefault,
		up: [
			executeKyselySchemaStatement(
				schemaName,
				`alterTable("${tableName}")`,
				`alterColumn("${columnName}", (col) => col.setDefault(${sqlStatement(
					defaultValueAndHash.value ?? "",
				)}))`,
			),
			commentForDefault(schemaName, tableName, columnName, defaultValueAndHash),
		],
		down: [
			executeKyselySchemaStatement(
				schemaName,
				`alterTable("${tableName}")`,
				`alterColumn("${columnName}", (col) => col.dropDefault())`,
			),
		],
		schemaName,
	};
	return changeset;
}

function columnDefaultDropMigrationOperation(
	diff: ColumnDefaultDropDifference,
	{ schemaName, tablesToRename }: GeneratorContext,
) {
	const tableName = diff.path[1];
	const columnName = diff.path[3];

	const defaultValueAndHash = toValueAndHash(String(diff.oldValue));

	const changeset: Changeset = {
		priority: MigrationOpPriority.ChangeColumnDefaultDrop,
		phase: ChangesetPhase.Alter,
		schemaName,
		tableName: tableName,
		currentTableName: currentTableName(tableName, tablesToRename, schemaName),
		type: ChangeSetType.ChangeColumnDefault,
		up: [
			executeKyselySchemaStatement(
				schemaName,
				`alterTable("${tableName}")`,
				`alterColumn("${columnName}", (col) => col.dropDefault())`,
			),
		],
		down: [
			executeKyselySchemaStatement(
				schemaName,
				`alterTable("${tableName}")`,
				`alterColumn("${columnName}", (col) => col.setDefault(${sqlStatement(
					defaultValueAndHash.value ?? "",
				)}))`,
			),
			commentForDefault(schemaName, tableName, columnName, defaultValueAndHash),
		],
	};
	return changeset;
}

function columnDefaultChangeMigrationOperation(
	diff: ColumnDefaultChangeDifference,
	{ schemaName, tablesToRename, local }: GeneratorContext,
) {
	const tableName = diff.path[1];
	const columnName = diff.path[3];

	const newDefaultValueAndHash = toValueAndHash(String(diff.value));
	const oldDefaultValueAndHash = toValueAndHash(String(diff.oldValue));

	if (newDefaultValueAndHash.hash === oldDefaultValueAndHash.hash) {
		return [];
	}

	const up = [
		executeKyselySchemaStatement(
			schemaName,
			`alterTable("${tableName}")`,
			`alterColumn("${columnName}", (col) => col.setDefault(${sqlStatement(
				newDefaultValueAndHash.value ?? "",
			)}))`,
		),
	];

	up.push(
		commentForDefault(
			schemaName,
			tableName,
			columnName,
			newDefaultValueAndHash,
		),
	);

	const down = [
		executeKyselySchemaStatement(
			schemaName,
			`alterTable("${tableName}")`,
			`alterColumn("${columnName}", (col) => col.setDefault(${sqlStatement(
				oldDefaultValueAndHash.value ?? "",
			)}))`,
		),
	];

	down.push(
		commentForDefault(
			schemaName,
			tableName,
			columnName,
			oldDefaultValueAndHash,
		),
	);

	const changeset: Changeset = {
		priority: MigrationOpPriority.ChangeColumnDefaultChange,
		phase: ChangesetPhase.Alter,
		tableName: tableName,
		currentTableName: currentTableName(tableName, tablesToRename, schemaName),
		type: ChangeSetType.ChangeColumnDefault,
		up: up,
		down: down,
		schemaName,
	};
	if (columnDefaultIsVolatile(columnName, tableName, local)) {
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
	return changeset;
}

function columnDefaultIsVolatile(
	columnName: string,
	tableName: string,
	local: SchemaMigrationInfo,
) {
	const column = local.table[tableName]?.columns[columnName];
	const volatileDefault = column?.volatileDefault;
	return volatileDefault === "yes";
}
