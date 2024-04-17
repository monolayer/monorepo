import { Effect } from "effect";
import {
	SchemaMigrationInfo,
	introspectLocalSchema,
	introspectRemoteSchema,
	renameRemoteColums,
	renameTables,
} from "~/introspection/introspection.js";
import type { SchemaContext } from "./schema-context.js";

export function introspectSchemas({
	kyselyInstance,
	localSchema,
	schemaName,
	camelCasePlugin,
	tablesToRename,
}: SchemaContext) {
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
}: SchemaContext & { remote: SchemaMigrationInfo }) {
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
