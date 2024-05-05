import { Effect } from "effect";
import { toSnakeCase } from "~/changeset/helpers.js";
import { Schema, type AnySchema } from "~/database/schema/schema.js";
import { sortTableDependencies } from "~/introspection/dependencies.js";
import {
	SchemaMigrationInfo,
	introspectLocalSchema,
	introspectRemoteSchema,
	renameRemoteColums,
	renameTables,
} from "~/introspection/introspection.js";
import { devEnvirinmentDbClient } from "~/services/db-clients.js";
import {
	appEnvironmentCamelCasePlugin,
	appEnvironmentConfigurationSchemas,
} from "~/state/app-environment.js";
import type { TableAndColumnRenames } from "~/state/table-column-rename.js";

export function introspectRemote(schemaName: string) {
	return Effect.gen(function* () {
		const kysely = yield* devEnvirinmentDbClient("kyselyNoCamelCase");
		const camelCase = yield* appEnvironmentCamelCasePlugin;
		return yield* Effect.tryPromise(() =>
			introspectRemoteSchema(kysely, toSnakeCase(schemaName, camelCase)),
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

		const introspectedRemote = yield* introspectRemote(
			Schema.info(schema).name ?? "public",
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

export type TablesToRename = {
	from: string;
	to: string;
}[];

export type ColumnsToRename = Record<
	string,
	{
		from: string;
		to: string;
	}[]
>;
