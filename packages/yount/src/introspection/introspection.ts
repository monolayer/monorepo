import { Kysely } from "kysely";
import type { CamelCaseOptions } from "~/configuration.js";
import { dbExtensionInfo } from "~/database/extension/introspection.js";
import type { AnySchema } from "~/database/schema/schema.js";
import type { ColumnInfo } from "~/database/schema/table/column/types.js";
import { currentTableName } from "~/introspection/table-name.js";
import type {
	CheckInfo,
	ForeignKeyInfo,
	PrimaryKeyInfo,
	TriggerInfo,
	UniqueInfo,
} from "~/migrations/migration-schema.js";
import type { TablesToRename } from "~/programs/table-diff-prompt.js";
import {
	dbColumnInfo,
	localColumnInfoByTable,
	type TableInfo,
} from "../database/schema/table/column/instrospection.js";
import {
	dbCheckConstraintInfo,
	localCheckConstraintInfo,
} from "../database/schema/table/constraints/check/introspection.js";
import {
	dbForeignKeyConstraintInfo,
	localForeignKeyConstraintInfo,
} from "../database/schema/table/constraints/foreign-key/introspection.js";
import {
	dbPrimaryKeyConstraintInfo,
	localPrimaryKeyConstraintInfo,
} from "../database/schema/table/constraints/primary-key/introspection.js";
import {
	dbUniqueConstraintInfo,
	localUniqueConstraintInfo,
} from "../database/schema/table/constraints/unique/introspection.js";
import {
	dbIndexInfo,
	localIndexInfoByTable,
	type IndexInfo,
} from "../database/schema/table/index/introspection.js";
import { dbTableInfo } from "../database/schema/table/introspection.js";
import {
	dbTriggerInfo,
	localTriggersInfo,
} from "../database/schema/table/trigger/introspection.js";
import {
	dbEnumInfo,
	localEnumInfo,
	type EnumInfo,
} from "../database/schema/types/enum/introspection.js";

export function introspectLocalSchema(
	schema: AnySchema,
	remoteSchema: SchemaMigrationInfo,
	camelCase: CamelCaseOptions = { enabled: false },
	tablesToRename: TablesToRename = [],
): SchemaMigrationInfo {
	return {
		table: localColumnInfoByTable(schema, remoteSchema, camelCase),
		index: localIndexInfoByTable(schema, camelCase),
		foreignKeyConstraints: localForeignKeyConstraintInfo(
			schema,
			camelCase,
			tablesToRename,
		),
		uniqueConstraints: localUniqueConstraintInfo(schema, camelCase),
		checkConstraints: localCheckConstraintInfo(schema, camelCase),
		primaryKey: localPrimaryKeyConstraintInfo(schema, camelCase),
		triggers: {
			...localTriggersInfo(schema, camelCase),
		},
		enums: localEnumInfo(schema),
	};
}

export async function introspectRemoteSchema(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	kysely: Kysely<any>,
	schemaName = "public",
	tablesToRename: TablesToRename = [],
) {
	const remoteTableInfo = await dbTableInfo(kysely, schemaName);

	const tables = remoteTableInfo.reduce<string[]>((acc, table) => {
		if (table.name !== null) acc.push(table.name);
		return acc;
	}, []);

	const remoteColumnInfo = await dbColumnInfo(
		kysely,
		schemaName,
		tables,
		tablesToRename,
	);

	const remoteIndexInfo = await dbIndexInfo(kysely, schemaName, tables);

	const remoteUniqueConstraintInfo = await dbUniqueConstraintInfo(
		kysely,
		schemaName,
		tables,
		tablesToRename,
	);

	const remoteForeignKeyConstraintInfo = await dbForeignKeyConstraintInfo(
		kysely,
		schemaName,
		tables,
	);

	const primaryKeyConstraintInfo = await dbPrimaryKeyConstraintInfo(
		kysely,
		schemaName,
		tables,
		tablesToRename,
	);

	const triggerInfo = await dbTriggerInfo(kysely, schemaName, tables);

	const enumInfo = await dbEnumInfo(kysely, schemaName);

	const remoteCheckConstraintInfo = await dbCheckConstraintInfo(
		kysely,
		schemaName,
		tables,
		tablesToRename,
	);

	const migrationSchema: SchemaMigrationInfo = {
		table: remoteColumnInfo,
		index: remoteIndexInfo,
		foreignKeyConstraints: remoteForeignKeyConstraintInfo,
		uniqueConstraints: remoteUniqueConstraintInfo,
		checkConstraints: remoteCheckConstraintInfo,
		primaryKey: primaryKeyConstraintInfo,
		triggers: triggerInfo,
		enums: enumInfo,
	};
	return migrationSchema;
}

export async function remoteExtensions(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	kysely: Kysely<any>,
) {
	const extensions = await dbExtensionInfo(kysely);
	return {
		extensions,
	};
}

export type DbTableInfo = {
	table: TableColumnInfo;
	index?: IndexInfo;
};

export type TableColumnInfo = Record<string, TableInfo>;

export type LocalTableInfo = {
	table: TableColumnInfo;
	index?: IndexInfo;
};

export type SchemaMigrationInfo = {
	table: TableColumnInfo;
	index: IndexInfo;
	foreignKeyConstraints: ForeignKeyInfo;
	uniqueConstraints: UniqueInfo;
	checkConstraints: CheckInfo;
	primaryKey: PrimaryKeyInfo;
	triggers: TriggerInfo;
	enums: EnumInfo;
};

export function renameTables(
	remote: SchemaMigrationInfo,
	tablesToRename: TablesToRename,
) {
	const renamedTables = Object.entries(remote.table).reduce(
		(acc, [table, schema]) => {
			const current = currentTableName(table, tablesToRename);
			const renamedColumns = Object.entries(schema.columns).reduce(
				(schemaAcc, [column, info]) => {
					schemaAcc[column] = {
						...info,
						tableName: table,
					};
					return schemaAcc;
				},
				{} as Record<string, ColumnInfo & { tableName: string }>,
			);
			acc[current] = {
				name: schema.name,
				columns: renamedColumns,
			};
			return acc;
		},
		{} as TableColumnInfo,
	);

	const renamedIndexes = Object.entries(remote.index).reduce(
		(acc, [table, indexes]) => {
			const current = currentTableName(table, tablesToRename);
			acc[current] = indexes;
			return acc;
		},
		{} as IndexInfo,
	);

	const renamedForeignKeys = Object.entries(
		remote.foreignKeyConstraints,
	).reduce((acc, [table, foreignKeys]) => {
		const current = currentTableName(table, tablesToRename);
		acc[current] = foreignKeys;
		return acc;
	}, {} as ForeignKeyInfo);

	const renamedUniqueConstraints = Object.entries(
		remote.uniqueConstraints,
	).reduce((acc, [table, uniqueConstraints]) => {
		const current = currentTableName(table, tablesToRename);
		acc[current] = uniqueConstraints;
		return acc;
	}, {} as UniqueInfo);

	const renamedCheckConstraints = Object.entries(
		remote.checkConstraints,
	).reduce((acc, [table, checkConstraints]) => {
		const current = currentTableName(table, tablesToRename);
		acc[current] = checkConstraints;
		return acc;
	}, {} as CheckInfo);

	const renamedPrimaryKeys = Object.entries(remote.primaryKey).reduce(
		(acc, [table, primaryKey]) => {
			const current = currentTableName(table, tablesToRename);
			acc[current] = primaryKey;
			return acc;
		},
		{} as PrimaryKeyInfo,
	);

	const renamedTriggers = Object.entries(remote.triggers).reduce(
		(acc, [table, triggers]) => {
			const current = currentTableName(table, tablesToRename);
			acc[current] = triggers;
			return acc;
		},
		{} as TriggerInfo,
	);
	const renamedSchema: SchemaMigrationInfo = {
		table: renamedTables,
		index: renamedIndexes,
		foreignKeyConstraints: renamedForeignKeys,
		uniqueConstraints: renamedUniqueConstraints,
		checkConstraints: renamedCheckConstraints,
		primaryKey: renamedPrimaryKeys,
		triggers: renamedTriggers,
		enums: remote.enums,
	};
	return renamedSchema;
}
