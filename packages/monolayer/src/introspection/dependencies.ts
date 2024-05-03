import { Effect } from "effect";
import { Kysely, sql } from "kysely";
import toposort from "toposort";
import { Schema, type AnySchema } from "~/database/schema/schema.js";
import { foreignKeyOptions } from "~/database/schema/table/constraints/foreign-key/foreign-key.js";
import type { TablesToRename } from "~/introspection/introspect-schemas.js";
import { DbClients } from "~/services/db-clients.js";
import { configurationSchemas } from "~/services/environment.js";
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
	schemaName: string,
) {
	const dependencies = [
		...new Set([...databaseTableDependencies, ...localTableDependencies]),
	];
	return dependencies.reduce((acc, node) => {
		const tableName = currentTableName(node, tablesToRename, schemaName);
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
				acc.push([tableName, foreignKey.targetTable.split(".")[1]]);
			}
			return acc;
		},
		[] as [string, string | undefined][],
	);
	return toposort(entries);
}

export function schemaDependencies() {
	return Effect.gen(function* (_) {
		const schemas = yield* _(configurationSchemas());
		const dbClients = yield* _(DbClients);
		const remoteSchemaDeps = yield* _(
			Effect.tryPromise(() =>
				databaseSchemaDependencies(dbClients.currentEnvironment.kysely),
			),
		);
		const localSchemaDeps = localSchemaDependencies(schemas);
		return [...new Set([...remoteSchemaDeps, ...localSchemaDeps])].reverse();
	});
}

async function databaseSchemaDependencies(kysely: Kysely<InformationSchemaDB>) {
	const results = await kysely
		.selectFrom("pg_constraint")
		.innerJoin("pg_namespace", (join) =>
			join.onRef("pg_namespace.oid", "=", "pg_constraint.connamespace"),
		)
		.innerJoin("pg_class as source_table", (join) =>
			join.onRef("source_table.oid", "=", "pg_constraint.conrelid"),
		)
		.innerJoin("pg_class as target_table", (join) =>
			join.onRef("target_table.oid", "=", "pg_constraint.confrelid"),
		)
		.innerJoin("pg_namespace as dependency_ns", (join) =>
			join.onRef("dependency_ns.oid", "=", "target_table.relnamespace"),
		)
		.where("pg_constraint.contype", "=", "f")
		.whereRef("pg_namespace.nspname", "<>", "dependency_ns.nspname")
		.select([
			sql<string>`pg_namespace.nspname`.as("schema"),
			sql<string>`dependency_ns.nspname`.as("depends_on"),
		])
		.groupBy(["pg_namespace.nspname", "dependency_ns.nspname"])
		.execute();
	return toposort(results.map((row) => [row.schema, row.depends_on]));
}

function localSchemaDependencies(allSchemas: AnySchema[]) {
	const dependencies: [string, string][] = [];
	for (const schema of allSchemas) {
		const schemaInfo = Schema.info(schema);
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		for (const [_, table] of Object.entries(schemaInfo.tables)) {
			const info = tableInfo(table);
			const foreignKeys = info.definition.constraints?.foreignKeys ?? [];
			for (const foreignKey of foreignKeys) {
				const options = foreignKeyOptions(foreignKey);
				const targetTableInfo = tableInfo(options.targetTable);
				if (targetTableInfo.schemaName != info.schemaName) {
					dependencies.push([info.schemaName, targetTableInfo.schemaName]);
				}
			}
		}
	}
	return toposort(dependencies);
}
