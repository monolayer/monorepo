import { Effect } from "effect";
import { schemaChangeset } from "~/changeset/schema-changeset.js";
import { createSchemaChangeset } from "~/database/database_schemas/changeset.js";
import { schemaInDb } from "~/database/database_schemas/introspection.js";
import { type AnySchema } from "~/database/schema/schema.js";
import { type SchemaMigrationInfo } from "~/introspection/introspection.js";
import { sortTableDependencies } from "~/introspection/table-dependencies.js";
import { DevEnvironment } from "../services/environment.js";
import { changesetContext } from "./changeset-context.js";
import { columnDiffPrompt } from "./column-diff-prompt.js";
import {
	introspectSchemas,
	renameTablesInIntrospectedSchemas,
} from "./introspect-schemas.js";
import { tableDiffPrompt } from "./table-diff-prompt.js";

export function changeset() {
	return connectorSchemas().pipe(
		Effect.flatMap((connectorSchema) =>
			Effect.all(connectorSchema.flatMap(changesetForLocalSchema)).pipe(
				Effect.flatMap((changesets) =>
					Effect.succeed(changesets.flatMap((changeset) => changeset)),
				),
			),
		),
	);
}

function changesetForLocalSchema(localSchema: AnySchema) {
	return changesetContext(localSchema).pipe(
		Effect.flatMap((context) =>
			introspectSchemas(context).pipe(
				Effect.flatMap(({ local, remote }) =>
					tableDiff(local, remote).pipe(
						Effect.flatMap((tableDiff) =>
							Effect.tryPromise(() => tableDiffPrompt(tableDiff)),
						),
						Effect.flatMap((tablesToRename) =>
							renameTablesInIntrospectedSchemas({
								...context,
								tablesToRename,
								remote,
							}),
						),
						Effect.flatMap(({ local, remote, tablesToRename }) =>
							columnDiff(local, remote).pipe(
								Effect.flatMap((columnDiff) =>
									Effect.tryPromise(() => columnDiffPrompt(columnDiff)),
								),
								Effect.flatMap((columnsToRename) =>
									renameTablesInIntrospectedSchemas({
										...context,
										tablesToRename,
										columnsToRename,
										remote,
									}),
								),
								Effect.flatMap(
									({ local, remote, tablesToRename, columnsToRename }) =>
										Effect.succeed({
											local,
											remote,
											tablesToRename,
											columnsToRename,
											tableDepedencies: sortTableDependencies(
												remote.tablePriorities,
												local.tablePriorities,
												tablesToRename,
											),
										}),
								),
							),
						),
					),
				),
				Effect.flatMap(
					({
						local,
						remote,
						tablesToRename,
						columnsToRename,
						tableDepedencies,
					}) =>
						Effect.succeed(
							schemaChangeset(
								local,
								remote,
								context.schemaName,
								context.camelCasePlugin,
								tablesToRename,
								columnsToRename,
								tableDepedencies,
							),
						),
				),
				Effect.tap((changesets) =>
					Effect.tryPromise(() =>
						schemaInDb(context.kyselyInstance, context.schemaName),
					).pipe(
						Effect.flatMap((schemaInDatabase) =>
							Effect.succeed(schemaInDatabase.length !== 0),
						),
						Effect.tap((exists) => {
							if (exists === false) {
								changesets.unshift(createSchemaChangeset(context.schemaName));
							}
						}),
					),
				),
			),
		),
	);
}

function connectorSchemas() {
	return DevEnvironment.pipe(
		Effect.flatMap((environment) =>
			Effect.succeed(environment.connector.schemas),
		),
	);
}

function tableDiff(local: SchemaMigrationInfo, remote: SchemaMigrationInfo) {
	const localTables = Object.keys(local.table);
	const remoteTables = Object.keys(remote.table);
	return Effect.succeed({
		added: localTables.filter((table) => !remoteTables.includes(table)),
		deleted: remoteTables.filter((table) => !localTables.includes(table)),
	});
}

function columnDiff(local: SchemaMigrationInfo, remote: SchemaMigrationInfo) {
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
