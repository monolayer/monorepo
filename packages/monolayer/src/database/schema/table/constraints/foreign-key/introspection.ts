/* eslint-disable max-lines */
import { sql, type Kysely } from "kysely";
import { toSnakeCase } from "~/changeset/helpers.js";
import type { CamelCaseOptions } from "~/configuration.js";
import { ForeignKeyRule } from "~/database/schema/introspect-table.js";
import { Schema, type AnySchema } from "~/database/schema/schema.js";
import { tableInfo } from "~/introspection/helpers.js";
import type {
	ColumnsToRename,
	TablesToRename,
} from "~/introspection/introspect-schemas.js";
import { type ForeignKeyInfo } from "~/introspection/schema.js";
import { previousTableName } from "~/introspection/table-name.js";
import { hashValue } from "~/utils.js";
import type { InformationSchemaDB } from "../../../../../introspection/types.js";
import { ForeignKeyBuilder } from "./builder.js";

export async function dbForeignKeyConstraintInfo(
	fetchInfo: Awaited<ReturnType<typeof fetchForeignConstraintInfo>>,
) {
	const transformedResults = fetchInfo.reduce<ForeignKeyInfo>((acc, result) => {
		const constraintHash = result.conname!.match(
			/^\w+_(\w+)_monolayer_fk$/,
		)![1];
		const statement = ForeignKeyBuilder.toStatement({
			...result,
			isExternal: false,
		});
		const recomputedHash = hashValue(statement);
		const hashKey =
			constraintHash === recomputedHash ? constraintHash : recomputedHash;

		const table = result.table;
		if (table !== null) {
			acc[table] = {
				...acc[table],
				...{
					[`${hashKey}`]: statement,
				},
			};
		}
		return acc;
	}, {});
	return transformedResults;
}

export async function fetchForeignConstraintInfo(
	kysely: Kysely<InformationSchemaDB>,
	databaseSchema: string,
	tableNames: string[],
) {
	if (tableNames.length === 0) {
		return [];
	}

	return await kysely
		.selectFrom("pg_constraint as con")
		.fullJoin("pg_class as tbl", (join) =>
			join.onRef("tbl.oid", "=", "con.conrelid"),
		)
		.fullJoin("pg_namespace as ns", (join) =>
			join.onRef("ns.oid", "=", "tbl.relnamespace"),
		)
		.fullJoin("pg_attribute as col", (join) =>
			join
				.onRef("col.attrelid", "=", "tbl.oid")
				.on("col.attnum", "=", sql`ANY(con.conkey)`),
		)
		.fullJoin("pg_class as ref_tbl", (join) =>
			join.onRef("con.confrelid", "=", "ref_tbl.oid"),
		)
		.fullJoin("pg_attribute as relcol", (join) =>
			join
				.onRef("relcol.attrelid", "=", "ref_tbl.oid")
				.on("relcol.attnum", "=", sql`ANY(con.conkey)`),
		)
		.fullJoin("information_schema.referential_constraints as rc", (join) =>
			join.onRef("rc.constraint_name", "=", "con.conname"),
		)
		.fullJoin("information_schema.constraint_column_usage as cu", (join) =>
			join.onRef("cu.constraint_name", "=", "con.conname"),
		)
		.select([
			"con.conname",
			sql<"FOREIGN KEY">`'FOREIGN KEY'`.as("constraintType"),
			sql<string>`tbl.relname`.as("table"),
			sql<string[]>`JSON_AGG(DISTINCT col.attname)`.as("columns"),
			sql<string>`ref_tbl.relname`.as("targetTable"),
			sql<string[]>`JSON_AGG(DISTINCT cu.column_name)`.as("targetColumns"),
			sql<ForeignKeyRule>`rc.delete_rule`.as("deleteRule"),
			sql<ForeignKeyRule>`rc.update_rule`.as("updateRule"),
		])
		.where("con.contype", "=", "f")
		.where("ns.nspname", "=", databaseSchema)
		.where("con.conname", "~", "monolayer_fk$")
		.where("tbl.relname", "in", tableNames)
		.groupBy([
			"tbl.relname",
			"ref_tbl.relname",
			"rc.delete_rule",
			"rc.update_rule",
			"con.confrelid",
			"con.conname",
		])
		.execute();
}

export function localForeignKeyConstraintInfo(
	schema: AnySchema,
	camelCase: CamelCaseOptions,
	tablesToRename: TablesToRename = [],
	columnsToRename: ColumnsToRename = {},
) {
	const tables = Schema.info(schema).tables;
	return Object.entries(tables || {}).reduce<ForeignKeyInfo>(
		(acc, [tableName, tableDefinition]) => {
			const transformedTableName = toSnakeCase(tableName, camelCase);
			const introspect = tableInfo(tableDefinition).introspect(tables);
			const foreignKeys = introspect.foreignKeys;
			if (foreignKeys !== undefined) {
				for (const foreignKey of foreignKeys) {
					const builder = new ForeignKeyBuilder(
						transformedTableName,
						foreignKey,
						{ camelCase, tablesToRename, columnsToRename },
					);

					acc[transformedTableName] = {
						...acc[transformedTableName],
						...{
							[`${builder.key("previous")}`]: `${builder.query("previous")}`,
						},
					};
				}
			}
			return acc;
		},
		{},
	);
}

export function localForeignKeyConstraintHashes(
	schema: AnySchema,
	camelCase: CamelCaseOptions,
	tablesToRename: TablesToRename,
	columnsToRename: ColumnsToRename,
) {
	const tables = Schema.info(schema).tables;
	return Object.entries(tables || {}).reduce(
		(acc, [tableName, tableDefinition]) => {
			const tableNameInDatabase = toSnakeCase(tableName, camelCase);
			const introspect = tableInfo(tableDefinition).introspect(tables);
			const foreignKeys = introspect.foreignKeys;
			if (foreignKeys !== undefined) {
				for (const foreignKey of foreignKeys) {
					const tableKey = previousTableName(
						tableNameInDatabase,
						tablesToRename,
					);
					const builder = new ForeignKeyBuilder(
						tableNameInDatabase,
						foreignKey,
						{ camelCase, tablesToRename, columnsToRename },
					);
					acc[tableKey] = {
						...acc[tableKey],
						...{
							[`${builder.key("previous")}`]: `${tableNameInDatabase}:${builder.key("current")}`,
						},
					};
				}
			}
			return acc;
		},
		{} as Record<string, Record<string, string>>,
	);
}
