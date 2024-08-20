import { currentTableName } from "@monorepo/pg/introspection/introspection/table-name.js";
import type { TablesToRename } from "@monorepo/pg/introspection/schema.js";
import { tableInfo } from "@monorepo/pg/introspection/table.js";
import { foreignKeyOptions } from "@monorepo/pg/schema/foreign-key.js";
import { Schema } from "@monorepo/pg/schema/schema.js";
import { DbClients } from "@monorepo/services/db-clients.js";
import { appEnvironmentConfigurationSchemas } from "@monorepo/state/app-environment.js";
import { Effect } from "effect";
import { appendAll, flatMap, map, reduce, reverse, union } from "effect/Array";
import { gen, zipWith } from "effect/Effect";
import { sql } from "kysely";
import toposort from "toposort";

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
	return reduce<string, string[]>(
		union(databaseTableDependencies, localTableDependencies),
		[],
		(acc, node) => {
			acc.push(node);
			const tableName = currentTableName(node, tablesToRename, schemaName);
			if (tableName !== node) acc.push(tableName);
			return acc;
		},
	);
}

export const schemaDependencies = gen(function* () {
	return yield* zipWith(
		databaseSchemaDependencies,
		localSchemaDependencies,
		(r, l) => reverse(appendAll(r, l)),
	);
});

const databaseSchemaDependencies = gen(function* () {
	const dbClients = yield* DbClients;
	const kysely = dbClients.kysely;
	const results = yield* Effect.tryPromise(() =>
		kysely
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
			.execute(),
	);
	return toposort(results.map((row) => [row.schema, row.depends_on]));
});

type SchemaDependency = [string, string];

const localSchemaDependencies = gen(function* () {
	const allSchemas = yield* appEnvironmentConfigurationSchemas;
	const dependencies = flatMap(allSchemas, (schema) =>
		flatMap(Object.values(Schema.info(schema).tables), (table) => {
			const info = tableInfo(table);
			const foreignKeys = info.definition.constraints?.foreignKeys ?? [];
			return map(foreignKeys, (foreignKey) => {
				const options = foreignKeyOptions(foreignKey);
				const foreignKeyTargetTable = options.targetTable ?? table;
				if (typeof foreignKeyTargetTable !== "string") {
					const targetTableInfo = tableInfo(foreignKeyTargetTable);
					if (targetTableInfo.schemaName != info.schemaName) {
						return [
							info.schemaName,
							targetTableInfo.schemaName,
						] as SchemaDependency;
					}
				}
				return [] as unknown as SchemaDependency;
			});
		}),
	);
	return toposort(dependencies);
});
