import { Kysely, sql } from "kysely";
import toposort from "toposort";
import type { AnySchema } from "~/database/schema/schema.js";
import type { TablesToRename } from "~/introspection/introspect-schemas.js";
import { tableInfo } from "./helpers.js";
import { currentTableName } from "./table-name.js";
import type { InformationSchemaDB } from "./types.js";

export type TableDependencies = {
	foreigh_key_table: string;
	primary_key_table: string;
}[];

export function sortTableDependencies(
	databaseTableDependencies: string[],
	localTableDependencies: string[],
	tablesToRename: TablesToRename,
) {
	const dependencies = [
		...new Set([...databaseTableDependencies, ...localTableDependencies]),
	];
	return dependencies.reduce((acc, node) => {
		const tableName = currentTableName(node, tablesToRename);
		acc.push(node);
		if (tableName !== node) {
			acc.push(tableName);
		}
		return acc;
	}, [] as string[]);
}

export async function databaseTableDependencies(
	kysely: Kysely<InformationSchemaDB>,
	schemaName = "public",
	tables: string[] = [],
) {
	if (tables.length == 0) {
		return [];
	}

	const result = await kysely
		.selectFrom("information_schema.table_constraints")
		.fullJoin("information_schema.key_column_usage", (join) =>
			join
				.onRef(
					"information_schema.table_constraints.constraint_name",
					"=",
					"information_schema.key_column_usage.constraint_name",
				)
				.onRef(
					"information_schema.table_constraints.table_schema",
					"=",
					"information_schema.key_column_usage.table_schema",
				),
		)
		.fullJoin("information_schema.constraint_column_usage", (join) =>
			join
				.onRef(
					"information_schema.constraint_column_usage.constraint_name",
					"=",
					"information_schema.key_column_usage.constraint_name",
				)
				.onRef(
					"information_schema.constraint_column_usage.table_schema",
					"=",
					"information_schema.key_column_usage.table_schema",
				),
		)
		.where(
			"information_schema.table_constraints.constraint_type",
			"=",
			"FOREIGN KEY",
		)
		.where(
			"information_schema.constraint_column_usage.table_schema",
			"=",
			schemaName,
		)
		.where("information_schema.table_constraints.table_name", "in", tables)
		.select([
			sql<string>`information_schema.table_constraints.table_name`.as(
				"foreigh_key_table",
			),
			sql<string>`information_schema.constraint_column_usage.table_name`.as(
				"primary_key_table",
			),
		])
		.execute();

	const mapped = result.map(
		(row) =>
			[row.foreigh_key_table, row.primary_key_table] as [
				string,
				string | undefined,
			],
	);

	return toposort(mapped);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function localSchemaTableDependencies(
	local: AnySchema,
	allSchemas: AnySchema[],
) {
	const tables = local.tables;
	const entries = Object.entries(tables).reduce(
		(acc, [tableName, table]) => {
			const introspect = tableInfo(table).introspect(allSchemas);
			for (const foreignKey of introspect.foreignKeys) {
				acc.push([tableName, foreignKey.targetTable]);
			}
			return acc;
		},
		[] as [string, string | undefined][],
	);
	return toposort(entries);
}
