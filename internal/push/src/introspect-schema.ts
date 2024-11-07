import type { BuilderContext } from "@monorepo/pg/introspection/introspection/foreign-key-builder.js";
import {
	introspectLocalSchema,
	introspectRemoteSchema,
} from "@monorepo/pg/introspection/introspection/introspection.js";
import type { TablesToRename } from "@monorepo/pg/introspection/schema.js";
import { Schema, type AnySchema } from "@monorepo/pg/schema/schema.js";
import { DbClients } from "@monorepo/services/db-clients.js";
import {
	appEnvironmentCamelCasePlugin,
	appEnvironmentConfigurationSchemas,
} from "@monorepo/state/app-environment.js";
import { Effect } from "effect";
import type { SchemaMigrationInfo } from "~push/changeset/types/schema.js";
import { type ColumnsToRename, type Renames } from "~push/state/rename.js";
import { toSnakeCase } from "./changeset/introspection.js";

export function introspectSchema(
	schema: AnySchema,
	renames?: Renames,
	fromPrompt: boolean = false,
) {
	return Effect.gen(function* () {
		const allSchemas = yield* appEnvironmentConfigurationSchemas;

		const schemaName = Schema.info(schema).name || "public";
		const introspectedRemote = yield* introspectRemote(
			schemaName,
			{ tables: [], columns: {} },
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

export type SchemaIntrospection = {
	schema: AnySchema;
	allSchemas: AnySchema[];
	schemaName: string;
	local: SchemaMigrationInfo;
	remote: SchemaMigrationInfo;
	tableDiff: {
		added: string[];
		deleted: string[];
	};
	tablesToRename: TablesToRename;
	tablePriorities: string[];
	columnsToRename: ColumnsToRename;
};
