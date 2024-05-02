import { Effect } from "effect";
import { schemaChangeset } from "~/changeset/schema-changeset.js";
import { type AnySchema } from "~/database/schema/schema.js";
import { configurationSchemas } from "~/services/environment.js";
import {
	introspectSchemas,
	renameMigrationInfo,
	sortTablePriorities,
	type IntrospectionContext,
} from "../introspection/introspect-schemas.js";
import { selectColumnDiffChoicesInteractive } from "../introspection/select-column-diff-choices.js";
import { selectTableDiffChoicesInteractive } from "../introspection/select-table-diff-choices.js";
import { context } from "./context.js";
import { validateForeignKeyReferences } from "./validate-foreign-key-references.js";

export function changeset() {
	return configurationSchemas().pipe(
		Effect.flatMap((configurationSchema) =>
			Effect.all(
				configurationSchema.flatMap((schema) =>
					changesetForLocalSchema(schema, configurationSchema),
				),
			).pipe(
				Effect.flatMap((changesets) =>
					Effect.succeed(changesets.flatMap((changeset) => changeset)),
				),
			),
		),
	);
}

function changesetForLocalSchema(
	localSchema: AnySchema,
	allSchemas: AnySchema[],
) {
	return context(localSchema).pipe(
		Effect.tap(() => validateForeignKeyReferences(localSchema)),
		Effect.flatMap(() =>
			introspectSchemas(localSchema, allSchemas).pipe(
				Effect.tap(selectTableDiffChoicesInteractive),
				Effect.flatMap(renameMigrationInfo),
				Effect.tap(selectColumnDiffChoicesInteractive),
				Effect.flatMap(renameMigrationInfo),
				Effect.flatMap(sortTablePriorities),
				Effect.flatMap(computeChangeset),
			),
		),
	);
}

function computeChangeset(introspectionContext: IntrospectionContext) {
	return context(introspectionContext.schema).pipe(
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
