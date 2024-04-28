import { Effect } from "effect";
import { schemaChangeset } from "~/changeset/schema-changeset.js";
import { type AnySchema } from "~/database/schema/schema.js";
import { changesetContext } from "./changeset-context.js";
import { configurationSchemas } from "./configuration-schemas.js";
import {
	introspectSchemas,
	renameMigrationInfo,
	sortTablePriorities,
	type IntrospectionContext,
} from "./introspect-schemas.js";
import { selectColumnDiffChoicesInteractive } from "./select-column-diff-choices.js";
import { selectTableDiffChoicesInteractive } from "./select-table-diff-choices.js";
import { validateForeignKeyReferences } from "./validate-foreign-key-references.js";

export function changeset() {
	return configurationSchemas().pipe(
		Effect.flatMap((configurationSchema) =>
			Effect.all(configurationSchema.flatMap(changesetForLocalSchema)).pipe(
				Effect.flatMap((changesets) =>
					Effect.succeed(changesets.flatMap((changeset) => changeset)),
				),
			),
		),
	);
}

function changesetForLocalSchema(localSchema: AnySchema) {
	return changesetContext(localSchema).pipe(
		Effect.tap(() => validateForeignKeyReferences(localSchema)),
		Effect.flatMap(() =>
			introspectSchemas(localSchema).pipe(
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
