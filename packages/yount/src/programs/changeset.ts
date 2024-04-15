import { Effect } from "effect";
import { schemaChangeset } from "~/changeset/schema-changeset.js";
import { createSchemaChangeset } from "~/database/database_schemas/changeset.js";
import { schemaInDb } from "~/database/database_schemas/introspection.js";
import { type AnySchema } from "~/database/schema/schema.js";
import { DevEnvironment } from "../services/environment.js";
import { introspectSchemas } from "./introspect-schemas.js";
import { schemaContext } from "./schema-context.js";

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
	return schemaContext(localSchema).pipe(
		Effect.flatMap((context) =>
			introspectSchemas(context).pipe(
				Effect.flatMap(({ local, remote }) =>
					Effect.succeed(
						schemaChangeset(
							local,
							remote,
							context.schemaName,
							context.camelCasePlugin,
						),
					),
				),
				Effect.tap((changeset) =>
					Effect.tryPromise(() =>
						schemaInDb(context.kyselyInstance, context.schemaName),
					).pipe(
						Effect.flatMap((schemaInDatabase) =>
							Effect.succeed(schemaInDatabase.length !== 0),
						),
						Effect.tap((exists) => {
							if (exists === false) {
								changeset.unshift(createSchemaChangeset(context.schemaName));
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

