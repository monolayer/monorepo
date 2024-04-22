import { Effect } from "effect";
import { schemaChangeset } from "~/changeset/schema-changeset.js";
import type { Changeset } from "~/changeset/types.js";
import { createSchemaChangeset } from "~/database/database_schemas/changeset.js";
import { schemaInDb } from "~/database/database_schemas/introspection.js";
import { type AnySchema } from "~/database/schema/schema.js";
import {
	changesetContext,
	type ChangesetContext,
} from "./changeset-context.js";
import { connectorSchemas } from "./connector-schemas.js";
import {
	introspectSchemas,
	renameMigrationInfo,
	selectColumnDiffChoicesInteractive,
	selectTableDiffChoicesInteractive,
	sortTablePriorities,
	type IntrospectionContext,
} from "./introspect-schemas.js";

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
			introspectSchemas(localSchema).pipe(
				Effect.tap(selectTableDiffChoicesInteractive),
				Effect.flatMap(renameMigrationInfo),
				Effect.tap(selectColumnDiffChoicesInteractive),
				Effect.flatMap(renameMigrationInfo),
				Effect.flatMap(sortTablePriorities),
				Effect.flatMap(computeChangeset),
				Effect.tap((changesets) =>
					addCreateSchemaChangset(changesets, context),
				),
			),
		),
	);
}

function computeChangeset(introspectionContext: IntrospectionContext) {
	return changesetContext(introspectionContext.schema).pipe(
		Effect.flatMap((context) =>
			Effect.succeed(
				schemaChangeset(
					introspectionContext.local,
					introspectionContext.remote,
					introspectionContext.schemaName,
					context.camelCasePlugin,
					introspectionContext.tablesToRename,
					introspectionContext.columnsToRename,
					introspectionContext.tablePriorities,
				),
			),
		),
	);
}

function addCreateSchemaChangset(
	changesets: Changeset[],
	context: ChangesetContext,
) {
	return Effect.tryPromise(() =>
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
	);
}
