import type { BuilderContext } from "@monorepo/pg/introspection/introspection/foreign-key-builder.js";
import {
	introspectLocalSchema,
	introspectRemoteSchema,
} from "@monorepo/pg/introspection/introspection/introspection.js";
import { Schema, type AnySchema } from "@monorepo/pg/schema/schema.js";
import { DbClients } from "@monorepo/services/db-clients.js";
import {
	appEnvironmentCamelCasePlugin,
	appEnvironmentConfigurationSchemas,
} from "@monorepo/state/app-environment.js";
import { Effect } from "effect";
import type { SchemaMigrationInfo } from "~push/changeset/types/schema.js";
import { type Renames, type TableToRename } from "~push/state/rename.js";
import { toSnakeCase } from "./changeset/introspection.js";
import type { SchemaIntrospection } from "./changeset/schema-changeset.js";

export function introspectSchema(schema: AnySchema, renames?: Renames) {
	return Effect.gen(function* () {
		const allSchemas = yield* appEnvironmentConfigurationSchemas;

		const schemaName = Schema.info(schema).name || "public";

		const skip = Object.entries(schema.tables ?? {}).reduce<
			Record<string, string[]>
		>((acc, [tableName, table]) => {
			acc[previousName(tableName, schemaName, renames?.tables ?? [])] =
				table.mapped;
			return acc;
		}, {});

		const introspectedRemote = yield* introspectRemote(
			schemaName,
			{ tables: [], columns: {} },
			skip,
			false,
		);

		const introspectedLocalSchema = yield* introspectLocal(
			schema,
			introspectedRemote,
			allSchemas,
		);
		const localTables = Object.keys(introspectedLocalSchema.table);
		const remoteTables = Object.keys(introspectedRemote.table);
		const tableDiff = {
			added: localTables.filter((table) => !remoteTables.includes(table)),
			deleted: remoteTables.filter((table) => !localTables.includes(table)),
		};

		const introspectionContext: SchemaIntrospection = {
			schema,
			schemaName: Schema.info(schema).name || "public",
			local: introspectedLocalSchema,
			remote: introspectedRemote,
			tableDiff,
			tablesToRename: renames?.tables ?? [],
			tablePriorities: introspectedRemote.tablePriorities,
			columnsToRename: renames?.columns ?? {},
			allSchemas,
		};
		return introspectionContext;
	});
}

function introspectRemote(
	schemaName: string,
	renames: Renames,
	skip: Record<string, string[]>,
	external = false,
) {
	return Effect.gen(function* () {
		const kysely = (yield* DbClients).kyselyNoCamelCase;
		const camelCase = yield* appEnvironmentCamelCasePlugin;
		const currentSchemaName = toSnakeCase(schemaName, camelCase);
		const builderContext: BuilderContext = {
			camelCase,
			tablesToRename: renames.tables !== undefined ? renames.tables : [],
			columnsToRename:
				renames.tables !== undefined ? (renames.columns ?? {}) : {},
			schemaName: currentSchemaName,
			external,
			skip,
		};

		return yield* Effect.tryPromise(() =>
			introspectRemoteSchema(kysely, currentSchemaName, builderContext),
		);
	});
}

function introspectLocal(
	schema: AnySchema,
	remote: SchemaMigrationInfo,
	allSchemas: AnySchema[],
) {
	return Effect.gen(function* () {
		const camelCase = yield* appEnvironmentCamelCasePlugin;
		const schemaName = Schema.info(schema).name || "public";
		return introspectLocalSchema(
			schema,
			remote,
			camelCase,
			[],
			{},
			schemaName,
			allSchemas,
		);
	});
}

function previousName(
	tableName: string,
	schemaName: string,
	renames: TableToRename[],
) {
	const renamed = renames.find(
		(rename) => rename.schema === schemaName && rename.to === tableName,
	);
	return renamed ? renamed.from : tableName;
}
