import { type Kysely, sql } from "kysely";
import { toSnakeCase } from "~pg/helpers/to-snake-case.js";
import type { InformationSchemaDB } from "~pg/introspection/introspection/types.js";
import {
	type ColumnsToRename,
	primaryKeyColumns,
	type PrimaryKeyInfo,
} from "~pg/introspection/schema.js";
import { tableInfo } from "~pg/introspection/table.js";
import type { ColumnRecord } from "~pg/schema/column.js";
import { type AnyPgPrimaryKey, PgPrimaryKey } from "~pg/schema/primary-key.js";
import { type AnySchema, Schema } from "~pg/schema/schema.js";
import type { AnyPgTable } from "~pg/schema/table.js";

export type PrimaryKeyConstraintInfo = {
	constraintType: "PRIMARY KEY";
	table: string | null;
	columns: string[];
};

export async function dbPrimaryKeyConstraintInfo(
	kysely: Kysely<InformationSchemaDB>,
	databaseSchema: string,
	tableNames: string[],
) {
	if (tableNames.length === 0) {
		return {};
	}
	const results = await kysely
		.selectFrom("pg_constraint")
		.fullJoin("pg_class as tbl", (join) =>
			join.onRef("tbl.oid", "=", "pg_constraint.conrelid"),
		)
		.fullJoin("pg_namespace as ns", (join) =>
			join.onRef("tbl.relnamespace", "=", "ns.oid"),
		)
		.fullJoin("pg_attribute as att", (join) =>
			join
				.onRef("att.attrelid", "=", "tbl.oid")
				.on("att.attnum", "=", sql`ANY(pg_constraint.conkey)`),
		)
		.select([
			sql<"PRIMARY KEY">`'PRIMARY KEY'`.as("constraintType"),
			sql<string>`tbl.relname`.as("table"),
			sql<string[]>`json_agg(att.attname ORDER BY att.attnum)`.as("columns"),
			"pg_constraint.conname",
		])
		.where("pg_constraint.contype", "=", "p")
		.where("ns.nspname", "=", databaseSchema)
		.where("tbl.relname", "in", tableNames)
		.groupBy(["tbl.relname", "pg_constraint.conname"])
		.orderBy(["table"])
		.execute();
	const transformedResults = results.reduce<PrimaryKeyInfo>((acc, result) => {
		const key = `${result.conname}`;
		const constraintInfo = {
			[key]: primaryKeyConstraintInfoToQuery(result),
		};
		const table = result.table;
		acc[table] = {
			...acc[table],
			...constraintInfo,
		};
		return acc;
	}, {});
	return transformedResults;
}

export function localPrimaryKeyConstraintInfo(
	schema: AnySchema,
	camelCase: boolean,
	columnsToRename: ColumnsToRename,
) {
	const schemaInfo = Schema.info(schema);
	const tables = schemaInfo.tables;
	return Object.entries(tables || {}).reduce<PrimaryKeyInfo>(
		(acc, [tableName, tableDefinition]) => {
			const transformedTableName = toSnakeCase(tableName, camelCase);
			const columns = tableInfo(tableDefinition).definition
				.columns as ColumnRecord;
			const primaryKeys = primaryKeyColumns(
				columns,
				camelCase,
				tableName,
				columnsToRename,
				schemaInfo.name,
			);
			if (primaryKeys.length !== 0 && !isExternalPrimaryKey(tableDefinition)) {
				const keyName = `${transformedTableName}_pkey`;
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
	const pgPrimaryKey = tableInfo(table).definition?.constraints
		?.primaryKey as unknown as AnyPgPrimaryKey | undefined;
	return (
		pgPrimaryKey !== undefined && PgPrimaryKey.info(pgPrimaryKey).isExternal
	);
}

export function primaryKeyConstraintInfoToQuery(
	info: PrimaryKeyConstraintInfo,
) {
	const columns = info.columns.sort();
	return [`(${columns.map((col) => `"${col}"`).join(", ")})`].join(" ");
}
