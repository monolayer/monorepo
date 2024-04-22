import { Effect } from "effect";
import type { CamelCaseOptions } from "~/configuration.js";
import { Schema, type AnySchema } from "~/database/schema/schema.js";
import {
	SchemaMigrationInfo,
	introspectLocalSchema,
	introspectRemoteSchema,
	renameRemoteColums,
	renameTables,
} from "~/introspection/introspection.js";
import { sortTableDependencies } from "~/introspection/table-dependencies.js";
import {
	columnDiffPrompt,
	type ColumnsToRename,
} from "./column-diff-prompt.js";
import { devEnvirinmentDbClient } from "./db-clients.js";
import { camelCaseOptions } from "./dev-environment.js";
import { tableDiffPrompt, type TablesToRename } from "./table-diff-prompt.js";

export function introspectRemote(schemaName?: string) {
	return Effect.gen(function* (_) {
		const kysely = yield* _(devEnvirinmentDbClient("kyselyNoCamelCase"));
		return yield* _(
			Effect.tryPromise(() =>
				introspectRemoteSchema(kysely, schemaName ?? "public"),
			),
		);
	});
}

export function introspectLocal(
	schema: AnySchema,
	remote: SchemaMigrationInfo,
) {
	return Effect.gen(function* (_) {
		const camelCase = yield* _(camelCaseOptions());
		return introspectLocalSchema(schema, remote, camelCase);
	});
}

export type IntrospectionContext = {
	schema: AnySchema;
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

export function introspectSchemas(schema: AnySchema) {
	return Effect.gen(function* (_) {
		const introspectedRemote = yield* _(
			introspectRemote(Schema.info(schema).name),
		);
		const introspectedLocalSchema = yield* _(
			introspectLocal(schema, introspectedRemote),
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
		};
		return introspectionContext;
	});
}

export function renameTablesInIntrospectedSchemas({
	localSchema,
	camelCasePlugin,
	tablesToRename = [],
	remote,
	columnsToRename = {},
}: {
	localSchema: AnySchema;
	camelCasePlugin: CamelCaseOptions;
	tablesToRename: TablesToRename;
	columnsToRename: ColumnsToRename;
	remote: SchemaMigrationInfo;
}) {
	const renamedRemote = renameTables(remote, tablesToRename, columnsToRename);
	const renamedColums = renameRemoteColums(renamedRemote, columnsToRename);

	const remoteSchemaMigrationInfo: SchemaMigrationInfo = {
		...renamedRemote,
		table: renamedColums,
	};

	return Effect.succeed({
		local: introspectLocalSchema(
			localSchema,
			remoteSchemaMigrationInfo,
			camelCasePlugin,
			tablesToRename,
			columnsToRename,
		),
		remote: remoteSchemaMigrationInfo,
		tablesToRename,
		columnsToRename,
	});
}

export function renameMigrationInfo(context: IntrospectionContext) {
	return Effect.gen(function* (_) {
		const camelCase = yield* _(camelCaseOptions());
		context.remote = renameTables(
			context.remote,
			context.tablesToRename,
			context.columnsToRename,
		);
		context.remote.table = renameRemoteColums(
			context.remote,
			context.columnsToRename,
		);
		context.local = introspectLocalSchema(
			context.schema,
			context.remote,
			camelCase,
			context.tablesToRename,
			context.columnsToRename,
		);
		return context;
	});
}

export function sortTablePriorities(context: IntrospectionContext) {
	context.tablePriorities = sortTableDependencies(
		context.remote.tablePriorities,
		context.local.tablePriorities,
		context.tablesToRename,
	);
	return Effect.succeed(context);
}
export function selectColumnDiffChoicesInteractive(
	context: IntrospectionContext,
) {
	return columnDiff(context.local, context.remote).pipe(
		Effect.flatMap((columnDiff) =>
			Effect.tryPromise(() => columnDiffPrompt(columnDiff)),
		),
		Effect.tap((columnsToRename) => {
			context.columnsToRename = columnsToRename;
		}),
	);
}

export function columnDiff(
	local: SchemaMigrationInfo,
	remote: SchemaMigrationInfo,
) {
	const localEntries = Object.entries(local.table);
	const diff = localEntries.reduce(
		(acc, [tableName, table]) => {
			const remoteTable = remote.table[tableName];
			if (remoteTable === undefined) {
				return acc;
			}
			const localColumns = Object.keys(table.columns);
			const remoteColumns = Object.keys(remoteTable.columns);
			const added = localColumns.filter(
				(column) => !remoteColumns.includes(column),
			);
			const deleted = remoteColumns.filter(
				(column) => !localColumns.includes(column),
			);
			acc[tableName] = { added, deleted };
			return acc;
		},
		{} as Record<string, { added: string[]; deleted: string[] }>,
	);
	return Effect.succeed(diff);
}

export function selectTableDiffChoicesInteractive(
	context: IntrospectionContext,
) {
	return Effect.tryPromise(() => tableDiffPrompt(context.tableDiff)).pipe(
		Effect.tap((tablesToRename) => (context.tablesToRename = tablesToRename)),
	);
}
