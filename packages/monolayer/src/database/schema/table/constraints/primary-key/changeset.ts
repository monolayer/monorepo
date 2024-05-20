/* eslint-disable max-lines */
import type { Difference } from "microdiff";
import type { GeneratorContext } from "~/changeset/schema-changeset.js";
import {
	ChangeSetType,
	MigrationOpPriority,
	type Changeset,
} from "~/changeset/types.js";
import { currentColumName } from "~/introspection/column-name.js";
import type { TablesToRename } from "~/introspection/introspect-schemas.js";
import { currentTableName } from "~/introspection/table-name.js";
import {
	executeKyselyDbStatement,
	executeKyselySchemaStatement,
} from "../../../../../changeset/helpers.js";
import type { LocalTableInfo } from "../../../../../introspection/introspection.js";
import {
	columnNameKey,
	extractColumnsFromPrimaryKey,
	findColumnByNameInTable,
} from "../../../../../introspection/schema.js";
import { concurrentIndex } from "../../index/changeset.js";
import {
	addCheckWithSchemaStatements,
	dropCheckKyselySchemaStatement,
} from "../check/changeset.js";

export function primaryKeyMigrationOpGenerator(
	diff: Difference,
	context: GeneratorContext,
) {
	console.dir(diff, { depth: null });
	if (isPrimaryKeyCreate(diff)) {
		return createPrimaryKeyMigration(diff, context);
	}
	if (isPrimaryKeyDrop(diff)) {
		return dropPrimaryKeyMigration(diff, context);
	}
	if (isPrimaryKeyChange(diff, context)) {
		return changePrimaryKeyMigration(diff, context);
	}
}

type PrimaryKeyCreate = {
	type: "CREATE";
	path: ["primaryKey", string];
	value: {
		[key: string]: string;
	};
};

type PrimaryKeyDropDiff = {
	type: "REMOVE";
	path: ["primaryKey", string];
	oldValue: {
		[key: string]: string;
	};
};

type PrimaryKeyChangeDiff = {
	type: "CHANGE";
	path: ["primaryKey", string, string];
	value: string;
	oldValue: string;
};

function isPrimaryKeyCreate(test: Difference): test is PrimaryKeyCreate {
	return (
		test.type === "CREATE" &&
		test.path.length === 2 &&
		test.path[0] === "primaryKey" &&
		typeof test.path[1] === "string" &&
		typeof test.value === "object" &&
		Object.keys(test.value).length === 1
	);
}

function isPrimaryKeyDrop(test: Difference): test is PrimaryKeyDropDiff {
	return (
		test.type === "REMOVE" &&
		test.path.length === 2 &&
		test.path[0] === "primaryKey" &&
		typeof test.path[1] === "string" &&
		typeof test.oldValue === "object" &&
		Object.keys(test.oldValue).length === 1
	);
}

function isPrimaryKeyChange(
	test: Difference,
	context: GeneratorContext,
): test is PrimaryKeyChangeDiff {
	if (
		test.type === "CHANGE" &&
		test.path.length === 3 &&
		test.path[0] === "primaryKey" &&
		typeof test.path[1] === "string" &&
		typeof test.path[2] === "string" &&
		typeof test.value === "string" &&
		typeof test.oldValue === "string"
	) {
		return (
			true &&
			primaryKeyColumnsChange(context, test.path[1], test.value, test.oldValue)
		);
	}

	return false;
}

export function primaryKeyColumnsChange(
	{ local, columnsToRename, schemaName }: GeneratorContext,
	tableName: string,
	value: string,
	oldValue: string,
) {
	const tb = local.table[tableName]!;
	const oldColumns = extractColumnsFromPrimaryKey(oldValue)
		.map((val) => currentColumName(tableName, schemaName, val, columnsToRename))
		.sort();

	const newColumns = extractColumnsFromPrimaryKey(value)
		.map((val) => currentColumName(tableName, schemaName, val, columnsToRename))
		.map((val) => columnNameKey(tb, val))
		.filter((x) => x !== undefined)
		.sort();

	return (
		newColumns.length !== oldColumns.length ||
		!newColumns.every((col, i) => col === oldColumns[i])
	);
}

function createPrimaryKeyMigration(
	diff: PrimaryKeyCreate,
	{ schemaName, addedTables, local, tablesToRename }: GeneratorContext,
) {
	const tableName = diff.path[1];
	const primaryKeyName = Object.keys(diff.value)[0] as keyof typeof diff.value;
	const primaryKeyValue = diff.value[
		primaryKeyName
	] as (typeof diff.value)[keyof typeof diff.value];

	if (!addedTables.includes(tableName)) {
		return onlinePrimaryKey(
			schemaName,
			tableName,
			primaryKeyName as string,
			primaryKeyValue,
			tablesToRename,
			local,
		);
	} else {
		return defaultPrimaryKey(
			schemaName,
			tableName,
			primaryKeyName as string,
			primaryKeyValue,
			tablesToRename,
			addedTables,
			local,
		);
	}
}

function dropPrimaryKeyMigration(
	diff: PrimaryKeyDropDiff,
	{ schemaName, droppedTables, local, tablesToRename }: GeneratorContext,
) {
	const tableName = diff.path[1];
	const primaryKeyName = Object.keys(
		diff.oldValue,
	)[0] as keyof typeof diff.oldValue;
	const primaryKeyValue = diff.oldValue[
		primaryKeyName
	] as (typeof diff.oldValue)[keyof typeof diff.oldValue];

	const changeset: Changeset = {
		priority: MigrationOpPriority.PrimaryKeyDrop,
		schemaName,
		tableName: tableName,
		currentTableName: currentTableName(tableName, tablesToRename, schemaName),
		type: ChangeSetType.DropPrimaryKey,
		up: droppedTables.includes(tableName)
			? [[]]
			: [
					dropPrimaryKeyOp(tableName, primaryKeyName as string, schemaName),
					executeKyselySchemaStatement(
						schemaName,
						`dropIndex("${tableName}_monolayer_pk_idx")`,
						"ifExists()",
					),
				],
		down: [
			addPrimaryKeyOp(
				tableName,
				primaryKeyName as string,
				primaryKeyValue,
				schemaName,
			),
		],
	};

	const dropNotNull = droppedTables.includes(tableName)
		? []
		: dropNotNullChangesets(
				primaryKeyValue,
				tableName,
				local,
				schemaName,
				tablesToRename,
				"up",
			);

	return [changeset, ...dropNotNull];
}

function changePrimaryKeyMigration(
	diff: PrimaryKeyChangeDiff,
	{ schemaName, local, tablesToRename }: GeneratorContext,
) {
	const tableName = diff.path[1];
	const primaryKeyName = diff.path[2];

	const on = onlinePrimaryKey(
		schemaName,
		tableName,
		primaryKeyName as string,
		diff.value,
		tablesToRename,
		local,
	);

	const dropChangeset: Changeset = {
		priority: MigrationOpPriority.PrimaryKeyDrop,
		schemaName,
		tableName: tableName,
		currentTableName: currentTableName(tableName, tablesToRename, schemaName),
		type: ChangeSetType.DropPrimaryKey,
		up: [
			dropPrimaryKeyOp(tableName, primaryKeyName, schemaName),
			executeKyselySchemaStatement(
				schemaName,
				`dropIndex("${tableName}_monolayer_pk_idx")`,
				"ifExists()",
			),
		],
		down: [
			addPrimaryKeyOp(tableName, primaryKeyName, diff.oldValue, schemaName),
		],
	};

	const dropPrimaryKeyNotNull = dropNotNullChangesets(
		diff.oldValue,
		tableName,
		local,
		schemaName,
		tablesToRename,
		"up",
	);

	return [...on, dropChangeset, ...dropPrimaryKeyNotNull];
}

function addPrimaryKeyOp(
	tableName: string,
	primaryKeyName: string,
	primaryKeyValue: string,
	schemaName: string,
): string[] {
	return executeKyselySchemaStatement(
		schemaName,
		`alterTable("${tableName}")`,
		`addPrimaryKeyConstraint("${primaryKeyName}", [${extractColumnsFromPrimaryKey(
			primaryKeyValue,
		)
			.map((col) => `"${col}"`)
			.join(", ")}])`,
	);
}

function dropPrimaryKeyOp(
	tableName: string,
	primaryKeyName: string,
	schemaName: string,
) {
	return executeKyselySchemaStatement(
		schemaName,
		`alterTable("${tableName}")`,
		`dropConstraint("${primaryKeyName}")`,
	);
}

function dropNotNullOp(
	tableName: string,
	columnName: string,
	schemaName: string,
) {
	return executeKyselySchemaStatement(
		schemaName,
		`alterTable("${tableName}")`,
		`alterColumn("${columnName}", (col) => col.dropNotNull())`,
	);
}

function dropNotNullChangesets(
	primaryKeyValue: string,
	tableName: string,
	local: LocalTableInfo,
	schemaName: string,
	tablesToRename: TablesToRename,
	direction: "up" | "down",
) {
	const primaryKeyColumns = extractColumnsFromPrimaryKey(primaryKeyValue);
	const changesets: Changeset[] = [];

	if (primaryKeyColumns !== null && primaryKeyColumns !== undefined) {
		for (const column of primaryKeyColumns) {
			const table = local.table[tableName];
			if (table !== undefined) {
				const tableColumn =
					table.columns[column] || findColumnByNameInTable(table, column);
				if (tableColumn !== undefined) {
					if (tableColumn.originalIsNullable === undefined) {
						if (tableColumn.isNullable) {
							changesets.push({
								priority: MigrationOpPriority.ChangeColumnNullable,
								schemaName,
								tableName: tableName,
								currentTableName: currentTableName(
									tableName,
									tablesToRename,
									schemaName,
								),
								type: ChangeSetType.ChangeColumn,
								up:
									direction === "up"
										? [dropNotNullOp(tableName, column, schemaName)]
										: [],
								down:
									direction === "down"
										? [dropNotNullOp(tableName, column, schemaName)]
										: [],
							});
						}
					} else {
						if (tableColumn.originalIsNullable !== tableColumn.isNullable) {
							changesets.push({
								priority: MigrationOpPriority.ChangeColumnNullable,
								schemaName,
								tableName: tableName,
								currentTableName: currentTableName(
									tableName,
									tablesToRename,
									schemaName,
								),
								type: ChangeSetType.ChangeColumn,
								up:
									direction === "up"
										? [dropNotNullOp(tableName, column, schemaName)]
										: [],
								down:
									direction === "down"
										? [dropNotNullOp(tableName, column, schemaName)]
										: [],
							});
						}
					}
				}
			} else {
				changesets.push({
					priority: MigrationOpPriority.ChangeColumnNullable,
					schemaName,
					tableName: tableName,
					currentTableName: currentTableName(
						tableName,
						tablesToRename,
						schemaName,
					),
					type: ChangeSetType.ChangeColumn,
					up:
						direction === "up"
							? [dropNotNullOp(tableName, column, schemaName)]
							: [],
					down:
						direction === "down"
							? [dropNotNullOp(tableName, column, schemaName)]
							: [],
				});
			}
		}
	}
	return changesets;
}

function defaultPrimaryKey(
	schemaName: string,
	tableName: string,
	primaryKeyName: string,
	primaryKeyValue: string,
	tablesToRename: TablesToRename,
	addedTables: string[],
	local: LocalTableInfo,
) {
	const changeset: Changeset = {
		priority: MigrationOpPriority.PrimaryKeyCreate,
		schemaName,
		tableName: tableName,
		currentTableName: currentTableName(tableName, tablesToRename, schemaName),
		type: ChangeSetType.CreatePrimaryKey,
		up: [
			addPrimaryKeyOp(
				tableName,
				primaryKeyName as string,
				primaryKeyValue,
				schemaName,
			),
		],
		down: addedTables.includes(tableName)
			? [[]]
			: [dropPrimaryKeyOp(tableName, primaryKeyName as string, schemaName)],
	};

	const dropNotNull = addedTables.includes(tableName)
		? []
		: dropNotNullChangesets(
				primaryKeyValue,
				tableName,
				local,
				schemaName,
				tablesToRename,
				"down",
			);
	return [changeset, ...dropNotNull];
}

function onlinePrimaryKey(
	schemaName: string,
	tableName: string,
	primaryKeyName: string,
	primaryKeyValue: string,
	tablesToRename: TablesToRename,
	local: LocalTableInfo,
) {
	const indexName = `${tableName}_monolayer_pk_idx`;
	const indexDefinition = `create unique index concurrently "${indexName}" on "${schemaName}"."${tableName}" ${primaryKeyValue}`;
	const primaryKeyColumns = extractColumnsFromPrimaryKey(primaryKeyValue);
	const addChecks = primaryKeyColumns.flatMap((col) => {
		return addCheckWithSchemaStatements(schemaName, tableName, {
			name: `${col}_temporary_not_null_check_constraint`,
			definition: `"${col}" IS NOT NULL`,
		});
	});
	const dropChecks = primaryKeyColumns.flatMap((col) => {
		return [
			dropCheckKyselySchemaStatement(
				schemaName,
				tableName,
				`${col}_temporary_not_null_check_constraint`,
			),
		];
	});
	const primaryKeyDefinition = `alter table "${schemaName}"."${tableName}" add constraint "${primaryKeyName}" primary key using index "${indexName}"`;
	const changeset: Changeset[] = [
		{
			priority: MigrationOpPriority.IndexCreate,
			schemaName,
			tableName: tableName,
			currentTableName: currentTableName(tableName, tablesToRename, schemaName),
			type: ChangeSetType.CreateIndex,
			transaction: false,
			up: [concurrentIndex(schemaName, indexName, indexDefinition)],
			down: [
				executeKyselySchemaStatement(
					schemaName,
					`dropIndex("${indexName}")`,
					"ifExists()",
				),
			],
		},
		{
			priority: MigrationOpPriority.PrimaryKeyCreate,
			schemaName,
			tableName: tableName,
			currentTableName: currentTableName(tableName, tablesToRename, schemaName),
			type: ChangeSetType.CreatePrimaryKey,
			up: [
				...addChecks,
				...[executeKyselyDbStatement(primaryKeyDefinition)],
				...dropChecks,
			],
			down: [dropPrimaryKeyOp(tableName, primaryKeyName as string, schemaName)],
		},
	];

	return [
		...changeset,
		...dropNotNullChangesets(
			primaryKeyValue,
			tableName,
			local,
			schemaName,
			tablesToRename,
			"down",
		),
	];
}
