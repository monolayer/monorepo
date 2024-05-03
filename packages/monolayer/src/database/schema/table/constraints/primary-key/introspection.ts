import { sql, type Kysely } from "kysely";
import { toSnakeCase } from "~/changeset/helpers.js";
import type { CamelCaseOptions } from "~/configuration.js";
import { Schema, type AnySchema } from "~/database/schema/schema.js";
import {
	PgPrimaryKey,
	type AnyPgPrimaryKey,
} from "~/database/schema/table/constraints/primary-key/primary-key.js";
import { tableInfo } from "~/introspection/helpers.js";
import type { ColumnsToRename } from "~/introspection/introspect-schemas.js";
import {
	primaryKeyColumns,
	type PrimaryKeyInfo,
} from "~/introspection/schema.js";
import type { InformationSchemaDB } from "../../../../../introspection/types.js";
import { type ColumnRecord } from "../../table-column.js";
import type { AnyPgTable } from "../../table.js";

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
			sql<string>`tbl.relname`.as("table"),
			sql<string[]>`json_agg(att.attname ORDER BY att.attnum)`.as("columns"),
		])
		.where("con.contype", "=", "p")
		.where("ns.nspname", "=", databaseSchema)
		.where("con.conname", "~", "monolayer_pk$")
		.where("tbl.relname", "in", tableNames)
		.groupBy(["tbl.relname"])
		.orderBy(["table"])
		.execute();
	const transformedResults = results.reduce<PrimaryKeyInfo>((acc, result) => {
		const key = `${result.table}_monolayer_pk`;
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
	camelCase: CamelCaseOptions,
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
				const keyName = `${transformedTableName}_monolayer_pk`;
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
