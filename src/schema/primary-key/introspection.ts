import { sql, type Kysely } from "kysely";
import { toSnakeCase } from "~/changeset/helpers.js";
import {
	ActionStatus,
	type OperationAnyError,
	type OperationSuccess,
} from "~/cli/command.js";
import type { CamelCaseOptions } from "~/config.js";
import {
	primaryKeyColumns,
	type PrimaryKeyInfo,
} from "~/migrations/migration-schema.js";
import { PgDatabase, type AnyPgDatabase } from "~/schema/pg-database.js";
import {
	PgPrimaryKey,
	type AnyPgPrimaryKey,
} from "~/schema/primary-key/primary-key.js";
import {
	tableInfo,
	type AnyPgTable,
	type ColumnRecord,
} from "~/schema/table/table.js";
import type { InformationSchemaDB } from "../../introspection/types.js";

export type PrimaryKeyConstraintInfo = {
	constraintType: "PRIMARY KEY";
	table: string | null;
	columns: string[];
};

export async function dbPrimaryKeyConstraintInfo(
	kysely: Kysely<InformationSchemaDB>,
	databaseSchema: string,
	tableNames: string[],
): Promise<OperationSuccess<PrimaryKeyInfo> | OperationAnyError> {
	try {
		if (tableNames.length === 0) {
			return {
				status: ActionStatus.Success,
				result: {},
			};
		}
		const results = await kysely
			.selectFrom("pg_constraint as con")
			.fullJoin("pg_class as tbl", (join) =>
				join.onRef("tbl.oid", "=", "con.conrelid"),
			)
			.fullJoin("pg_namespace as ns", (join) =>
				join.onRef("tbl.relnamespace", "=", "ns.oid"),
			)
			.fullJoin("pg_attribute as att", (join) =>
				join
					.onRef("att.attrelid", "=", "tbl.oid")
					.on("att.attnum", "=", sql`ANY(con.conkey)`),
			)
			.select([
				sql<"PRIMARY KEY">`'PRIMARY KEY'`.as("constraintType"),
				"tbl.relname as table",
				sql<string[]>`json_agg(att.attname ORDER BY att.attnum)`.as("columns"),
			])
			.where("con.contype", "=", "p")
			.where("ns.nspname", "=", databaseSchema)
			.where("con.conname", "~", "kinetic_pk$")
			.where("tbl.relname", "in", tableNames)
			.groupBy(["tbl.relname"])
			.orderBy(["table"])
			.execute();
		const transformedResults = results.reduce<PrimaryKeyInfo>((acc, result) => {
			const key = `${result.table}_${result.columns
				.sort()
				.join("_")}_kinetic_pk`;
			const constraintInfo = {
				[key]: primaryKeyConstraintInfoToQuery(result),
			};
			const table = result.table;
			if (table !== null) {
				acc[table] = {
					...acc[table],
					...constraintInfo,
				};
			}
			return acc;
		}, {});
		return {
			status: ActionStatus.Success,
			result: transformedResults,
		};
	} catch (error) {
		return {
			status: ActionStatus.Error,
			error: error,
		};
	}
}

export function localPrimaryKeyConstraintInfo(
	schema: AnyPgDatabase,
	camelCase: CamelCaseOptions,
) {
	const tables = PgDatabase.info(schema).tables;
	return Object.entries(tables || {}).reduce<PrimaryKeyInfo>(
		(acc, [tableName, tableDefinition]) => {
			const transformedTableName = toSnakeCase(tableName, camelCase);
			const columns = tableInfo(tableDefinition).schema.columns as ColumnRecord;
			const primaryKeys = primaryKeyColumns(columns, camelCase);
			if (primaryKeys.length !== 0 && !isExternalPrimaryKey(tableDefinition)) {
				const keyName = `${transformedTableName}_${primaryKeys
					.sort()
					.join("_")}_kinetic_pk`;
				acc[transformedTableName] = {
					[keyName]: primaryKeyConstraintInfoToQuery({
						constraintType: "PRIMARY KEY",
						table: transformedTableName,
						columns: primaryKeys,
					}),
				};
			}
			return acc;
		},
		{},
	);
}

function isExternalPrimaryKey(table: AnyPgTable) {
	const pgPrimaryKey = tableInfo(table).schema?.constraints
		?.primaryKey as unknown as AnyPgPrimaryKey | undefined;
	return (
		pgPrimaryKey !== undefined && PgPrimaryKey.info(pgPrimaryKey).isExternal
	);
}

export function primaryKeyConstraintInfoToQuery(
	info: PrimaryKeyConstraintInfo,
) {
	const columns = info.columns.sort();
	return [
		`"${info.table}_${columns.join("_")}_kinetic_pk"`,
		"PRIMARY KEY",
		`(${columns.map((col) => `"${col}"`).join(", ")})`,
	].join(" ");
}
