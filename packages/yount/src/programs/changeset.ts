import { Effect } from "effect";
import type { Kysely } from "kysely";
import { schemaChangeset } from "~/changeset/schema-changeset.js";
import type { CamelCaseOptions } from "~/configuration.js";
import { createSchemaChangeset } from "~/database/database_schemas/changeset.js";
import { schemaInDb } from "~/database/database_schemas/introspection.js";
import { Schema, type AnySchema } from "~/database/schema/schema.js";
import {
	introspectLocalSchema,
	introspectRemoteSchema,
} from "~/introspection/introspection.js";
import { DbClients } from "../services/dbClients.js";
import { DevEnvironment } from "../services/environment.js";

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

function introspectSchemas(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	kyselyInstance: Kysely<any>,
	localSchema: AnySchema,
	schemaName: string,
	camelCasePlugin: CamelCaseOptions,
) {
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
						),
					),
				),
				Effect.flatMap((introspectedLocalSchema) =>
					Effect.succeed({
						local: introspectedLocalSchema,
						remote: introspectedRemote,
					}),
				),
			),
		),
	);
}

function changesetForLocalSchema(localSchema: AnySchema) {
	return context(localSchema).pipe(
		Effect.flatMap(([kyselyInstance, camelCasePlugin, schemaName]) =>
			introspectSchemas(
				kyselyInstance,
				localSchema,
				schemaName,
				camelCasePlugin,
			).pipe(
				Effect.flatMap(({ local, remote }) =>
					Effect.succeed(
						schemaChangeset(local, remote, schemaName, camelCasePlugin),
					),
				),
				Effect.tap((changeset) =>
					Effect.tryPromise(() => schemaInDb(kyselyInstance, schemaName)).pipe(
						Effect.flatMap((schemaInDatabase) =>
							Effect.succeed(schemaInDatabase.length !== 0),
						),
						Effect.tap((exists) => {
							if (exists === false) {
								changeset.unshift(createSchemaChangeset(schemaName));
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

function context(localSchema: AnySchema) {
	return Effect.all([DevEnvironment, DbClients]).pipe(
		Effect.flatMap(([devEnvironment, dbClients]) =>
			Effect.all([
				Effect.succeed(dbClients.developmentEnvironment.kyselyNoCamelCase),
				Effect.succeed(devEnvironment.camelCasePlugin || { enabled: false }),
				Effect.succeed(Schema.info(localSchema).name || "public"),
			]),
		),
	);
}
