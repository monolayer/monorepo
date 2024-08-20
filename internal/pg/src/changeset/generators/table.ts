import { gen } from "effect/Effect";
import { Difference } from "microdiff";
import { ChangesetGeneratorState } from "~pg/changeset/changeset-generator.js";
import type { GeneratorContext } from "~pg/changeset/generator-context.js";
import {
	type ColumnsInfoDiff,
	commentForDefault,
	tableColumnsOps,
	toValueAndHash,
} from "~pg/changeset/generators/helpers.js";
import { executeKyselySchemaStatement } from "~pg/changeset/helpers/helpers.js";
import {
	type Changeset,
	ChangesetPhase,
	ChangesetType,
	MigrationOpPriority,
} from "~pg/changeset/types.js";
import { ChangeWarningType } from "~pg/changeset/warnings/change-warning-type.js";
import { ChangeWarningCode } from "~pg/changeset/warnings/codes.js";
import { currentTableName } from "~pg/introspection/introspection/table-name.js";

export function tableMigrationOpGenerator(diff: Difference) {
	return gen(function* () {
		const context = yield* ChangesetGeneratorState.current;
		if (isCreateTable(diff)) {
			return createTableMigration(diff, context);
		}
		if (isDropTable(diff)) {
			return dropTableMigration(diff, context);
		}
		if (isTableNameChange(diff)) {
			return changeTableNameMigration(diff, context);
		}
	});
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
	{ schemaName, tablesToRename, typeAlignments }: GeneratorContext,
) {
	const tableName = diff.path[1];

	const up = [
		executeKyselySchemaStatement(
			schemaName,
			`createTable("${tableName}")`,
			...tableColumnsOps(diff.value.columns, typeAlignments),
		),
	];

	Object.entries(diff.value.columns).flatMap(([, column]) => {
		if (column.defaultValue !== null) {
			const valueAndHash = toValueAndHash(column.defaultValue);
			up.push(
				commentForDefault(
					schemaName,
					tableName,
					`${column.columnName}`,
					valueAndHash,
				),
			);
		}
	});

	const changeset: Changeset = {
		priority: MigrationOpPriority.TableCreate,
		phase: ChangesetPhase.Expand,
		tableName: tableName,
		currentTableName: currentTableName(tableName, tablesToRename, schemaName),
		type: ChangesetType.CreateTable,
		up: up,
		down: [
			executeKyselySchemaStatement(schemaName, `dropTable("${tableName}")`),
		],
		schemaName,
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
	{ schemaName, tablesToRename, typeAlignments }: GeneratorContext,
) {
	const tableName = diff.path[1];
	const down = [
		executeKyselySchemaStatement(
			schemaName,
			`createTable("${tableName}")`,
			...tableColumnsOps(diff.oldValue.columns, typeAlignments),
		),
	];

	Object.entries(diff.oldValue.columns).flatMap(([, column]) => {
		if (column.defaultValue !== null) {
			const valueAndHash = toValueAndHash(column.defaultValue);
			down.push(
				commentForDefault(
					schemaName,
					tableName,
					`${column.columnName}`,
					valueAndHash,
				),
			);
		}
	});

	const changeset: Changeset = {
		priority: MigrationOpPriority.TableDrop,
		phase: ChangesetPhase.Contract,
		tableName: tableName,
		currentTableName: currentTableName(tableName, tablesToRename, schemaName),
		type: ChangesetType.DropTable,
		warnings: [
			{
				type: ChangeWarningType.Destructive,
				code: ChangeWarningCode.TableDrop,
				schema: schemaName,
				table: currentTableName(tableName, tablesToRename, schemaName),
			},
		],
		up: [executeKyselySchemaStatement(schemaName, `dropTable("${tableName}")`)],
		down: down,
		schemaName,
	};
	return changeset;
}

export type ChangeTableNameDiff = {
	type: "CHANGE";
	path: ["table", string, "name"];
	value: string;
	oldValue: string;
};

export function isTableNameChange(
	test: Difference,
): test is ChangeTableNameDiff {
	return (
		test.type === "CHANGE" &&
		test.path.length === 3 &&
		test.path[0] === "table" &&
		test.path[2] === "name" &&
		typeof test.value === "string" &&
		typeof test.oldValue === "string"
	);
}

function changeTableNameMigration(
	diff: ChangeTableNameDiff,
	{ schemaName, tablesToRename }: GeneratorContext,
) {
	const changeset: Changeset = {
		priority: MigrationOpPriority.ChangeTableName,
		phase: ChangesetPhase.Alter,
		tableName: diff.oldValue,
		currentTableName: currentTableName(
			diff.oldValue,
			tablesToRename,
			schemaName,
		),
		type: ChangesetType.RenameTable,
		warnings: [
			{
				type: ChangeWarningType.BackwardIncompatible,
				code: ChangeWarningCode.TableRename,
				schema: schemaName,
				tableRename: { from: diff.oldValue, to: diff.value },
			},
		],
		up: [
			executeKyselySchemaStatement(
				schemaName,
				`alterTable("${diff.oldValue}")`,
				`renameTo("${diff.value}")`,
			),
		],
		down: [
			executeKyselySchemaStatement(
				schemaName,
				`alterTable("${diff.value}")`,
				`renameTo("${diff.oldValue}")`,
			),
		],
		schemaName,
	};
	return changeset;
}
