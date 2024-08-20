import { toSnakeCase } from "@monorepo/pg/helpers/to-snake-case.js";
import type { BuilderContext } from "@monorepo/pg/introspection/introspection/foreign-key-builder.js";
import {
	introspectLocalSchema,
	introspectRemoteSchema,
	renameRemoteColums,
	renameTables,
} from "@monorepo/pg/introspection/introspection/introspection.js";
import type { TablesToRename } from "@monorepo/pg/introspection/schema.js";
import type { SchemaMigrationInfo } from "@monorepo/pg/schema/column/types.js";
import { Schema, type AnySchema } from "@monorepo/pg/schema/schema.js";
import { DbClients } from "@monorepo/services/db-clients.js";
import {
	appEnvironmentCamelCasePlugin,
	appEnvironmentConfigurationSchemas,
} from "@monorepo/state/app-environment.js";
import type {
	ColumnsToRename,
	TableAndColumnRenames,
} from "@monorepo/state/table-column-rename.js";
import { Effect } from "effect";
import { sortTableDependencies } from "~programs/dependencies.js";

export function introspectRemote(
	schemaName: string,
	renames: TableAndColumnRenames,
	external = false,
) {
	return Effect.gen(function* () {
		const kysely = (yield* DbClients).kyselyNoCamelCase;
		const camelCase = yield* appEnvironmentCamelCasePlugin;
		const currentSchemaName = toSnakeCase(schemaName, camelCase);
		const builderContext: BuilderContext = {
			camelCase,
			tablesToRename: renames !== undefined ? renames.tablesToRename : [],
			columnsToRename: renames !== undefined ? renames.columnsToRename : {},
			schemaName: currentSchemaName,
			external,
		};

		return yield* Effect.tryPromise(() =>
			introspectRemoteSchema(kysely, currentSchemaName, builderContext),
		);
	});
}

export function introspectLocal(
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

export function introspectSchema(
	schema: AnySchema,
	renames?: TableAndColumnRenames,
) {
	return Effect.gen(function* () {
		const allSchemas = yield* appEnvironmentConfigurationSchemas;

		const schemaName = Schema.info(schema).name || "public";
		const introspectedRemote = yield* introspectRemote(
			schemaName,
			renames ?? { tablesToRename: [], columnsToRename: {} },
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
			tablesToRename: renames !== undefined ? renames.tablesToRename : [],
			tablePriorities: introspectedRemote.tablePriorities,
			columnsToRename: renames !== undefined ? renames.columnsToRename : {},
			allSchemas,
		};
		return introspectionContext;
	});
}

export function renameMigrationInfo(context: SchemaIntrospection) {
	return Effect.gen(function* () {
		const camelCase = yield* appEnvironmentCamelCasePlugin;
		context.remote = renameTables(
			context.remote,
			context.tablesToRename,
			context.columnsToRename,
			context.schemaName,
		);
		context.remote.table = renameRemoteColums(
			context.remote,
			context.columnsToRename,
			context.schemaName,
		);
		context.local = introspectLocalSchema(
			context.schema,
			context.remote,
			camelCase,
			context.tablesToRename,
			context.columnsToRename,
			Schema.info(context.schema).name || "public",
			context.allSchemas,
		);
		return context;
	});
}

export function sortTablePriorities(context: SchemaIntrospection) {
	context.tablePriorities = sortTableDependencies(
		context.remote.tablePriorities,
		context.local.tablePriorities,
		context.tablesToRename,
		context.schemaName,
	);
	return Effect.succeed(context);
}
