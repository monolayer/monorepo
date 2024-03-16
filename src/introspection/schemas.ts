import {
	CamelCasePlugin,
	Kysely,
	PostgresDialect,
	type Expression,
	type RawBuilder,
} from "kysely";
import pg from "pg";
import {
	ActionStatus,
	type OperationAnyError,
	type OperationSuccess,
} from "~/cli/command.js";
import type { CamelCaseOptions } from "~/config.js";
import { type AnyPgDatabase } from "~/schema/pg_database.js";
import { type MigrationSchema } from "../migrations/migration_schema.js";
import {
	dbCheckConstraintInfo,
	localCheckConstraintInfo,
} from "./check_constraints.js";
import {
	dbColumnInfo,
	localColumnInfoByTable,
	type ColumnsInfo,
} from "./columns.js";
import { dbEnumInfo, localEnumInfo } from "./enums.js";
import { dbExtensionInfo, localExtensionInfo } from "./extensions.js";
import {
	dbForeignKeyConstraintInfo,
	localForeignKeyConstraintInfo,
} from "./foreign_key_constraint.js";
import {
	dbIndexInfo,
	localIndexInfoByTable,
	type IndexInfo,
} from "./indexes.js";
import {
	dbPrimaryKeyConstraintInfo,
	localPrimaryKeyConstraintInfo,
} from "./primary_key_constraint.js";
import { dbTableInfo } from "./tables.js";
import { dbTriggerInfo, localTriggersInfo } from "./triggers.js";
import {
	dbUniqueConstraintInfo,
	localUniqueConstraintInfo,
} from "./unique_constraint.js";

export function compileDefaultExpression(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	expression: Expression<any>,
	camelCase = false,
) {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const kysely = new Kysely<any>({
		dialect: new PostgresDialect({
			pool: new pg.Pool({}),
		}),
		plugins: camelCase ? [new CamelCasePlugin()] : [],
	});

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const compiled = (expression as RawBuilder<any>).compile(kysely);
	return substituteSQLParameters({
		sql: compiled.sql,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		parameters: compiled.parameters as any[],
	});
}

function substituteSQLParameters(queryObject: {
	sql: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	parameters: any[];
}) {
	let { sql } = queryObject;
	const { parameters } = queryObject;
	// Replace each placeholder with the corresponding parameter from the array
	parameters.forEach((param, idx) => {
		// Create a regular expression for each placeholder (e.g., $1, $2)
		// Note: The backslash is escaped in the string, and '$' is escaped in the regex
		const regex = new RegExp(`\\$${idx + 1}`, "g");
		const value = typeof param === "object" ? JSON.stringify(param) : param;
		sql = sql.replace(regex, value);
	});

	return sql;
}

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
