import { Effect } from "effect";
import { schemaChangeset } from "~/changeset/schema-changeset.js";
import { type AnySchema } from "~/database/schema/schema.js";
import {
	appEnvironmentCamelCasePlugin,
	appEnvironmentConfigurationSchemas,
} from "~/state/app-environment.js";
import { type TableAndColumnRenames } from "~/state/table-column-rename.js";
import {
	introspectSchema,
	renameMigrationInfo,
	sortTablePriorities,
	type IntrospectionContext,
} from "../introspection/introspect-schemas.js";
import { context } from "./context.js";
import { promptSchemaRenames } from "./schema-rename.js";
import { validateForeignKeyReferences } from "./validate-foreign-key-references.js";

export function changeset() {
	return promptSchemaRenames.pipe(
		Effect.flatMap((renames) =>
			appEnvironmentConfigurationSchemas.pipe(
				Effect.flatMap((configurationSchemas) =>
					Effect.all(
						configurationSchemas.flatMap((schema) =>
							changesetForLocalSchema(schema, configurationSchemas, renames),
						),
					).pipe(
						Effect.flatMap((changesets) =>
							Effect.succeed(changesets.flatMap((changeset) => changeset)),
						),
					),
				),
			),
		),
	);
}

function changesetForLocalSchema(
	localSchema: AnySchema,
	allSchemas: AnySchema[],
	renames: TableAndColumnRenames,
) {
	return context(localSchema).pipe(
		Effect.tap(() => validateForeignKeyReferences(localSchema, allSchemas)),
		Effect.flatMap(() =>
			introspectSchema(localSchema).pipe(
				Effect.tap((introspectionContext) => {
					introspectionContext.tablesToRename = renames.tablesToRename;
					introspectionContext.columnsToRename = renames.columnsToRename;
				}),
				Effect.flatMap(renameMigrationInfo),
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
