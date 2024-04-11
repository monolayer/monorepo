import { Kysely } from "kysely";
import type { CamelCaseOptions } from "~/configuration.js";
import { dbExtensionInfo } from "~/database/extension/introspection.js";
import type { AnySchema } from "~/database/schema/schema.js";
import type {
	CheckInfo,
	ForeignKeyInfo,
	PrimaryKeyInfo,
	TriggerInfo,
	UniqueInfo,
} from "~/migrations/migration-schema.js";
import {
	dbColumnInfo,
	localColumnInfoByTable,
	type ColumnsInfo,
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

export function localSchema(
	schema: AnySchema,
	remoteSchema: SchemaMigrationInfo,
	camelCase: CamelCaseOptions = { enabled: false },
): SchemaMigrationInfo {
	return {
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
	schemaName = "public",
) {
	const remoteTableInfo = await dbTableInfo(kysely, schemaName);

	const tables = remoteTableInfo.reduce<string[]>((acc, table) => {
		if (table.name !== null) acc.push(table.name);
		return acc;
	}, []);

	const remoteColumnInfo = await dbColumnInfo(kysely, schemaName, tables);

	const remoteIndexInfo = await dbIndexInfo(kysely, schemaName, tables);

	const remoteUniqueConstraintInfo = await dbUniqueConstraintInfo(
		kysely,
		schemaName,
		tables,
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
	);

	const triggerInfo = await dbTriggerInfo(kysely, schemaName, tables);

	const enumInfo = await dbEnumInfo(kysely, schemaName);

	const remoteCheckConstraintInfo = await dbCheckConstraintInfo(
		kysely,
		schemaName,
		tables,
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

export type TableColumnInfo = Record<string, ColumnsInfo>;

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
