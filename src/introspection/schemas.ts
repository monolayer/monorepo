import { Kysely } from "kysely";
import {
	ActionStatus,
	type OperationAnyError,
	type OperationSuccess,
} from "~/cli/command.js";
import type { CamelCaseOptions } from "~/config.js";
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
): Promise<OperationSuccess<MigrationSchema> | OperationAnyError> {
	const remoteTableInfo = await dbTableInfo(kysely, "public");
	if (remoteTableInfo.status === ActionStatus.Error) return remoteTableInfo;

	const tables = remoteTableInfo.result.reduce<string[]>((acc, table) => {
		if (table.name !== null) acc.push(table.name);
		return acc;
	}, []);

	const remoteColumnInfo = await dbColumnInfo(kysely, "public", tables);
	if (remoteColumnInfo.status === ActionStatus.Error) return remoteColumnInfo;

	const remoteIndexInfo = await dbIndexInfo(kysely, "public", tables);
	if (remoteIndexInfo.status === ActionStatus.Error) return remoteIndexInfo;

	const remoteUniqueConstraintInfo = await dbUniqueConstraintInfo(
		kysely,
		"public",
		tables,
	);
	if (remoteUniqueConstraintInfo.status === ActionStatus.Error)
		return remoteUniqueConstraintInfo;

	const remoteForeignKeyConstraintInfo = await dbForeignKeyConstraintInfo(
		kysely,
		"public",
		tables,
	);
	if (remoteForeignKeyConstraintInfo.status === ActionStatus.Error)
		return remoteForeignKeyConstraintInfo;

	const primaryKeyConstraintInfo = await dbPrimaryKeyConstraintInfo(
		kysely,
		"public",
		tables,
	);

	if (primaryKeyConstraintInfo.status === ActionStatus.Error)
		return primaryKeyConstraintInfo;

	const extensionInfo = await dbExtensionInfo(kysely, "public");
	if (extensionInfo.status === ActionStatus.Error) return extensionInfo;

	const triggerInfo = await dbTriggerInfo(kysely, "public", tables);
	if (triggerInfo.status === ActionStatus.Error) return triggerInfo;

	const enumInfo = await dbEnumInfo(kysely, "public");
	if (enumInfo.status === ActionStatus.Error) return enumInfo;

	const remoteCheckConstraintInfo = await dbCheckConstraintInfo(
		kysely,
		"public",
		tables,
	);

	if (remoteCheckConstraintInfo.status === ActionStatus.Error)
		return remoteCheckConstraintInfo;

	return {
		status: ActionStatus.Success,
		result: {
			extensions: extensionInfo.result,
			table: remoteColumnInfo.result,
			index: remoteIndexInfo.result,
			foreignKeyConstraints: remoteForeignKeyConstraintInfo.result,
			uniqueConstraints: remoteUniqueConstraintInfo.result,
			checkConstraints: remoteCheckConstraintInfo.result,
			primaryKey: primaryKeyConstraintInfo.result,
			triggers: triggerInfo.result,
			enums: enumInfo.result,
		},
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
