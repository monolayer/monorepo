import { sql, type Kysely } from "kysely";
import {
	ActionStatus,
	type OperationAnyError,
	type OperationSuccess,
} from "~/cli/command.js";
import { PgEnum, type ColumnInfo } from "~/schema/pg_column.js";
import { PgDatabase, type AnyPgDatabase } from "~/schema/pg_database.js";
import { tableInfo } from "~/schema/pg_table.js";
import type { InformationSchemaDB } from "./types.js";

export async function dbEnumInfo(
	kysely: Kysely<InformationSchemaDB>,
	databaseSchema: string,
): Promise<OperationSuccess<EnumInfo> | OperationAnyError> {
	try {
		const results = await kysely
			.selectFrom("pg_type")
			.innerJoin("pg_enum", (join) =>
				join.onRef("pg_enum.enumtypid", "=", "pg_type.oid"),
			)
			.innerJoin("pg_namespace", (join) =>
				join.onRef("pg_namespace.oid", "=", "pg_type.typnamespace"),
			)
			.leftJoin("pg_description", (join) =>
				join
					.onRef("pg_description.objoid", "=", "pg_type.oid")
					.on("pg_description.objsubid", "=", 0),
			)
			.select([
				"pg_type.typname as enum_name",
				sql<string[]>`json_agg(pg_enum.enumlabel)`.as("enum_values"),
			])
			.where("pg_namespace.nspname", "=", databaseSchema)
			.where("pg_type.typtype", "=", "e")
			.where("pg_description.description", "=", "kinetic")
			.groupBy("pg_type.typname")
			.groupBy("pg_namespace.nspname")
			.orderBy("pg_type.typname")
			.execute();

		const enumInfo = results.reduce<EnumInfo>((acc, curr) => {
			acc[curr.enum_name] = curr.enum_values.sort().join(", ");
			return acc;
		}, {});

		return {
			status: ActionStatus.Success,
			result: enumInfo,
		};
	} catch (error) {
		return {
			status: ActionStatus.Error,
			error,
		};
	}
}

export function localEnumInfo(schema: AnyPgDatabase) {
	const tables = PgDatabase.info(schema).tables;
	return Object.entries(tables).reduce<EnumInfo>(
		(enumInfo, [, tableDefinition]) => {
			const columns = tableInfo(tableDefinition).schema.columns;
			const keys = Object.keys(columns);
			for (const key of keys) {
				const column = columns[key];
				if (column instanceof PgEnum) {
					const columnDef = Object.fromEntries(Object.entries(column)) as {
						info: ColumnInfo;
						values: string[];
					};
					const enumName = columnDef.info.dataType;
					if (enumName !== null) {
						enumInfo[enumName] = (columnDef.values as string[]).join(", ");
					}
				}
			}
			return enumInfo;
		},
		{},
	);
}

export type EnumInfo = Record<string, string>;
