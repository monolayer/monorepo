import { Kysely } from "kysely";
import {
	ActionStatus,
	type OperationAnyError,
	type OperationSuccess,
} from "~/cli/command.js";
import type { CamelCaseOptions } from "~/configuration.js";
import type {
	CheckInfo,
	ForeignKeyInfo,
	PrimaryKeyInfo,
	TriggerInfo,
	UniqueInfo,
} from "~/migrations/migration-schema.js";
import type { AnyPgDatabase } from "~/schema/pg-database.js";
import {
	dbExtensionInfo,
	localExtensionInfo,
	type ExtensionInfo,
} from "../schema/extension/introspection.js";
import {
	dbColumnInfo,
	localColumnInfoByTable,
	type ColumnsInfo,
} from "../schema/table/column/instrospection.js";
import {
	dbCheckConstraintInfo,
	localCheckConstraintInfo,
} from "../schema/table/constraints/check/introspection.js";
import {
	dbForeignKeyConstraintInfo,
	localForeignKeyConstraintInfo,
} from "../schema/table/constraints/foreign-key/introspection.js";
import {
	dbPrimaryKeyConstraintInfo,
	localPrimaryKeyConstraintInfo,
} from "../schema/table/constraints/primary-key/introspection.js";
import {
	dbUniqueConstraintInfo,
	localUniqueConstraintInfo,
} from "../schema/table/constraints/unique/introspection.js";
import {
	dbIndexInfo,
	localIndexInfoByTable,
	type IndexInfo,
} from "../schema/table/index/introspection.js";
import { dbTableInfo } from "../schema/table/introspection.js";
import {
	dbTriggerInfo,
	localTriggersInfo,
} from "../schema/table/trigger/introspection.js";
import {
	dbEnumInfo,
	localEnumInfo,
	type EnumInfo,
} from "../schema/types/enum/introspection.js";

export function localSchema(
	schema: AnyPgDatabase,
	remoteSchema: MigrationSchema,
	camelCase: CamelCaseOptions = { enabled: false },
): MigrationSchema {
	return {
		extensions: localExtensionInfo(schema),
		table: localColumnInfoByTable(schema, remoteSchema, camelCase),
		index: localIndexInfoByTable(schema, camelCase),
		foreignKeyConstraints: localForeignKeyConstraintInfo(schema, camelCase),
		uniqueConstraints: localUniqueConstraintInfo(schema, camelCase),
		checkConstraints: localCheckConstraintInfo(schema, camelCase),
		primaryKey: localPrimaryKeyConstraintInfo(schema, camelCase),
		triggers: {
			...localTriggersInfo(schema, camelCase),
		},
		enums: localEnumInfo(schema),
	};
}

export async function remoteSchema(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	kysely: Kysely<any>,
) {

	const tables = remoteTableInfo.reduce<string[]>((acc, table) => {
		if (table.name !== null) acc.push(table.name);
		return acc;
	}, []);

	const remoteColumnInfo = await dbColumnInfo(kysely, "public", tables);

	const remoteIndexInfo = await dbIndexInfo(kysely, "public", tables);

	const remoteUniqueConstraintInfo = await dbUniqueConstraintInfo(
		kysely,
		"public",
		tables,
	);

	const remoteForeignKeyConstraintInfo = await dbForeignKeyConstraintInfo(
		kysely,
		"public",
		tables,
	);

	const primaryKeyConstraintInfo = await dbPrimaryKeyConstraintInfo(
		kysely,
		"public",
		tables,
	);

	const extensionInfo = await dbExtensionInfo(kysely, "public");

	const triggerInfo = await dbTriggerInfo(kysely, "public", tables);

	const enumInfo = await dbEnumInfo(kysely, "public");

	const remoteCheckConstraintInfo = await dbCheckConstraintInfo(
		kysely,
		"public",
		tables,
	);

	const migrationSchema: MigrationSchema = {
		extensions: extensionInfo,
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

export type DbTableInfo = {
	table: TableColumnInfo;
	index?: IndexInfo;
};

export type TableColumnInfo = Record<string, ColumnsInfo>;

export type LocalTableInfo = {
	table: TableColumnInfo;
	index?: IndexInfo;
};
export type MigrationSchema = {
	extensions: ExtensionInfo;
	table: TableColumnInfo;
	index: IndexInfo;
	foreignKeyConstraints: ForeignKeyInfo;
	uniqueConstraints: UniqueInfo;
	checkConstraints: CheckInfo;
	primaryKey: PrimaryKeyInfo;
	triggers: TriggerInfo;
	enums: EnumInfo;
};
