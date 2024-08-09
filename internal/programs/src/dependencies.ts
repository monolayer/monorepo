import { currentTableName } from "@monorepo/pg/introspection/introspection/table-name.js";
import type { InformationSchemaDB } from "@monorepo/pg/introspection/introspection/types.js";
import type { TablesToRename } from "@monorepo/pg/introspection/schema.js";
import { tableInfo } from "@monorepo/pg/introspection/table.js";
import { foreignKeyOptions } from "@monorepo/pg/schema/foreign-key.js";
import { Schema, type AnySchema } from "@monorepo/pg/schema/schema.js";
import { DbClients } from "@monorepo/services/db-clients.js";
import { appEnvironmentConfigurationSchemas } from "@monorepo/state/app-environment.js";
import { Effect } from "effect";
import { Kysely, sql } from "kysely";
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

export function schemaDependencies() {
	return Effect.gen(function* () {
		const schemas = yield* appEnvironmentConfigurationSchemas;
		const dbClients = yield* DbClients;
		const remoteSchemaDeps = yield* Effect.tryPromise(() =>
			databaseSchemaDependencies(dbClients.kysely),
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
				const foreignKeyTargetTable = options.targetTable ?? table;
				if (typeof foreignKeyTargetTable !== "string") {
					const targetTableInfo = tableInfo(foreignKeyTargetTable);
					if (targetTableInfo.schemaName != info.schemaName) {
						dependencies.push([info.schemaName, targetTableInfo.schemaName]);
					}
				}
			}
		}
	}
	return toposort(dependencies);
}
