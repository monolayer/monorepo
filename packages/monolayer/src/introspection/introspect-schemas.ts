import { Effect } from "effect";
import { Schema, type AnySchema } from "~/database/schema/schema.js";
import {
	SchemaMigrationInfo,
	introspectLocalSchema,
	introspectRemoteSchema,
	renameRemoteColums,
	renameTables,
} from "~/introspection/introspection.js";
import { sortTableDependencies } from "~/introspection/table-dependencies.js";
import { devEnvirinmentDbClient } from "~/services/db-clients.js";
import { camelCaseOptions } from "~/services/environment.js";

export function introspectRemote(schemaName: string) {
	return Effect.gen(function* (_) {
		const kysely = yield* _(devEnvirinmentDbClient("kyselyNoCamelCase"));
		return yield* _(
			Effect.tryPromise(() => introspectRemoteSchema(kysely, schemaName)),
		);
	});
}

export function introspectLocal(
	schema: AnySchema,
	remote: SchemaMigrationInfo,
	allSchemas: AnySchema[],
) {
	return Effect.gen(function* (_) {
		const camelCase = yield* _(camelCaseOptions());
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

export type IntrospectionContext = {
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

export function introspectSchemas(schema: AnySchema, allSchemas: AnySchema[]) {
	return Effect.gen(function* (_) {
		const introspectedRemote = yield* _(
			introspectRemote(Schema.info(schema).name ?? "public"),
		);
		const introspectedLocalSchema = yield* _(
			introspectLocal(schema, introspectedRemote, allSchemas),
		);

		const localTables = Object.keys(introspectedLocalSchema.table);
		const remoteTables = Object.keys(introspectedRemote.table);
		const tableDiff = {
			added: localTables.filter((table) => !remoteTables.includes(table)),
			deleted: remoteTables.filter((table) => !localTables.includes(table)),
		};

		const introspectionContext: IntrospectionContext = {
			schema,
			schemaName: Schema.info(schema).name || "public",
			local: introspectedLocalSchema,
			remote: introspectedRemote,
			tableDiff,
			tablesToRename: [],
			tablePriorities: introspectedRemote.tablePriorities,
			columnsToRename: {},
			allSchemas,
		};
		return introspectionContext;
	});
}

export function renameMigrationInfo(context: IntrospectionContext) {
	return Effect.gen(function* (_) {
		const camelCase = yield* _(camelCaseOptions());
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

export function sortTablePriorities(context: IntrospectionContext) {
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
