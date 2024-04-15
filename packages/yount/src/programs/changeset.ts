import { Effect } from "effect";
import { schemaChangeset } from "~/changeset/schema-changeset.js";
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

function changesetForLocalSchema(localSchema: AnySchema) {
	return context(localSchema).pipe(
		Effect.flatMap(([kyselyInstance, camelCasePlugin, schemaName]) =>
			Effect.tryPromise(() =>
				introspectRemoteSchema(kyselyInstance, schemaName),
			).pipe(
				Effect.flatMap((introspectedDatabaseSchema) =>
					Effect.succeed(
						introspectLocalSchema(
							localSchema,
							introspectedDatabaseSchema,
							camelCasePlugin,
						),
					).pipe(
						Effect.flatMap((introspectedLocalSchema) =>
							Effect.succeed(
								schemaChangeset(
									introspectedLocalSchema,
									introspectedDatabaseSchema,
									schemaName,
									camelCasePlugin,
								),
							),
						),
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
