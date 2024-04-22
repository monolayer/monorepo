import { Effect } from "effect";
import {
	SchemaMigrationInfo,
	introspectLocalSchema,
	introspectRemoteSchema,
	renameRemoteColums,
	renameTables,
} from "~/introspection/introspection.js";
import type { ChangesetContext } from "./changeset-context.js";

export function introspectSchemas({
	kyselyInstance,
	localSchema,
	schemaName,
	camelCasePlugin,
	tablesToRename,
}: ChangesetContext) {
	return Effect.unit.pipe(
		Effect.flatMap(() =>
			Effect.tryPromise(() =>
				introspectRemoteSchema(kyselyInstance, schemaName),
			),
		),
		Effect.flatMap((introspectedRemote) =>
			Effect.unit.pipe(
				Effect.flatMap(() =>
					Effect.succeed(
						introspectLocalSchema(
							localSchema,
							introspectedRemote,
							camelCasePlugin,
							tablesToRename,
						),
					),
				),
				Effect.flatMap((introspectedLocalSchema) =>
					Effect.succeed({
						local: introspectedLocalSchema,
						remote: introspectedRemote,
						tablesToRename: tablesToRename,
						tablePriorities: introspectedRemote.tablePriorities,
					}),
				),
			),
		),
	);
}

export function renameTablesInIntrospectedSchemas({
	localSchema,
	camelCasePlugin,
	tablesToRename,
	remote,
	columnsToRename,
}: ChangesetContext & { remote: SchemaMigrationInfo }) {
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
