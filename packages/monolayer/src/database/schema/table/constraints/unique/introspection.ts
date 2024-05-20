import { Kysely, sql } from "kysely";
import pg from "pg";
import { toSnakeCase } from "~/changeset/helpers.js";
import type { CamelCaseOptions } from "~/configuration.js";
import { Schema, type AnySchema } from "~/database/schema/schema.js";
import {
	isExternalUnique,
	uniqueConstraintOptions,
	type AnyPgUnique,
	type PgUnique,
} from "~/database/schema/table/constraints/unique/unique.js";
import { previousColumnName } from "~/introspection/column-name.js";
import { tableInfo } from "~/introspection/helpers.js";
import type { ColumnsToRename } from "~/introspection/introspect-schemas.js";
import type { UniqueInfo } from "~/introspection/schema.js";
import { MonolayerPostgresDialect } from "~/services/db-clients.js";
import { hashValue } from "~/utils.js";
import type { InformationSchemaDB } from "../../../../../introspection/types.js";

export type UniqueConstraintInfo = {
	constraintType: "UNIQUE";
	table: string;
	columns: string[];
	nullsDistinct: boolean;
};

export async function dbUniqueConstraintInfo(
	kysely: Kysely<InformationSchemaDB>,
	databaseSchema: string,
	tableNames: string[],
) {
	if (tableNames.length === 0) {
		return {};
	}
	const results = await kysely
		.selectFrom("pg_constraint")
		.fullJoin("pg_namespace", (join) =>
			join
				.onRef("pg_namespace.oid", "=", "pg_constraint.connamespace")
				.on("pg_namespace.nspname", "=", databaseSchema),
		)
		.fullJoin("pg_class", (join) =>
			join
				.onRef("pg_class.oid", "=", "pg_constraint.conrelid")
				.on("pg_namespace.nspname", "=", databaseSchema),
		)
		.fullJoin("pg_attribute", (join) =>
			join
				.onRef("pg_attribute.attrelid", "=", "pg_class.oid")
				.on("pg_attribute.attnum", "=", sql`ANY(pg_constraint.conkey)`),
		)
		.fullJoin("information_schema.table_constraints", (join) =>
			join
				.onRef(
					"information_schema.table_constraints.constraint_name",
					"=",
					"pg_constraint.conname",
				)
				.onRef(
					"information_schema.table_constraints.table_schema",
					"=",
					"pg_namespace.nspname",
				)
				.onRef(
					"information_schema.table_constraints.table_name",
					"=",
					"pg_class.relname",
				),
		)
		.select([
			sql<"UNIQUE">`'UNIQUE'`.as("constraintType"),
			sql<string>`pg_class.relname`.as("table"),
			sql<string>`pg_constraint.conname`.as("name"),
			sql<string[]>`json_agg(pg_attribute.attname)`.as("columns"),
		])
		.select((eb) => [
			eb
				.case()
				.when(sql`information_schema.table_constraints.nulls_distinct = 'YES'`)
				.then(true)
				.else(false)
				.end()
				.as("nullsDistinct"),
		])
		.where("pg_constraint.contype", "=", "u")
		.where("pg_constraint.conname", "~", "monolayer_key$")
		.where("pg_namespace.nspname", "=", databaseSchema)
		.where("pg_class.relname", "in", tableNames)
		.groupBy([
			"table",
			"information_schema.table_constraints.nulls_distinct",
			"pg_constraint.conname",
		])
		.execute();
	const transformedResults = results.reduce<UniqueInfo>((acc, result) => {
		const constraintHash = result.name.match(/^\w+_(\w+)_monolayer_key$/)![1];
		const constraintInfo = {
			[`${constraintHash}`]: uniqueConstraintInfoToQuery(result),
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

export function localUniqueConstraintInfo(
	schema: AnySchema,
	camelCase: CamelCaseOptions,
	columnsToRename: ColumnsToRename,
) {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const kysely = new Kysely<any>({
		dialect: new MonolayerPostgresDialect({
			pool: new pg.Pool({}),
		}),
	});
	const schemaInfo = Schema.info(schema);
	const tables = schemaInfo.tables;
	return Object.entries(tables || {}).reduce<UniqueInfo>(
		(acc, [tableName, tableDefinition]) => {
			const transformedTableName = toSnakeCase(tableName, camelCase);
			const uniqueConstraints = tableInfo(tableDefinition).definition
				.constraints?.unique as AnyPgUnique[];
			if (uniqueConstraints !== undefined) {
				for (const uniqueConstraint of uniqueConstraints) {
					if (isExternalUnique(uniqueConstraint)) {
						return acc;
					}
					const unique = uniqueToInfo(
						uniqueConstraint,
						transformedTableName,
						kysely,
						camelCase,
						columnsToRename,
						schemaInfo.name,
					);
					acc[transformedTableName] = {
						...acc[transformedTableName],
						...unique,
					};
				}
			}
			return acc;
		},
		{},
	);
}

export function uniqueToInfo(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	unique: PgUnique<any>,
	tableName: string,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	kysely: Kysely<any>,
	camelCase: CamelCaseOptions,
	columnsToRename: ColumnsToRename,
	schemaName: string,
) {
	const args = uniqueConstraintOptions(unique);
	const newTableName = toSnakeCase(tableName, camelCase);
	const hashColumns = args.columns
		.sort()
		.map((column) =>
			toSnakeCase(
				previousColumnName(
					tableName,
					schemaName,
					toSnakeCase(column, camelCase),
					columnsToRename,
				),
				camelCase,
			),
		);
	const columns = args.columns
		.sort()
		.map((column) => toSnakeCase(column, camelCase));
	const hash = hashValue(
		`${args.nullsDistinct}_${hashColumns.sort().join("_")}`,
	);
	const kyselyBuilder = kysely.schema
		.alterTable(newTableName)
		.addUniqueConstraint(hash, columns, (uc) => {
			if (args.nullsDistinct === false) {
				return uc.nullsNotDistinct();
			}
			return uc;
		});

	let compiledQuery = kyselyBuilder.compile().sql;

	compiledQuery = compiledQuery
		.replace(/alter table "\w+" add constraint /, "")
		.replace(`"${hash}" `, "");

	if (args.nullsDistinct) {
		compiledQuery = compiledQuery.replace("unique", "UNIQUE NULLS DISTINCT");
	} else {
		compiledQuery = compiledQuery.replace(
			"unique nulls not distinct",
			"UNIQUE NULLS NOT DISTINCT",
		);
	}

	return {
		[hash]: compiledQuery,
	};
}

export function uniqueConstraintInfoToQuery(info: UniqueConstraintInfo) {
	return [
		"UNIQUE",
		info.nullsDistinct ? "NULLS DISTINCT" : "NULLS NOT DISTINCT",
		`(${info.columns
			.sort()
			.map((col) => `"${col}"`)
			.join(", ")})`,
	].join(" ");
}
