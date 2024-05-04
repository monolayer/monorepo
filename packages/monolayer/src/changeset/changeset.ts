import { Effect } from "effect";
import { schemaChangeset } from "~/changeset/schema-changeset.js";
import { type AnySchema } from "~/database/schema/schema.js";
import { configurationSchemas } from "~/services/environment.js";
import {
	introspectSchemas,
	renameMigrationInfo,
	sortTablePriorities,
	type ColumnsToRename,
	type IntrospectionContext,
} from "../introspection/introspect-schemas.js";
import { selectColumnDiffChoicesInteractive } from "../introspection/select-column-diff-choices.js";
import { selectTableDiffChoicesInteractive } from "../introspection/select-table-diff-choices.js";
import { context } from "./context.js";
import { validateForeignKeyReferences } from "./validate-foreign-key-references.js";

export function changeset() {
	return schemaRenamePrompt().pipe(
		Effect.flatMap((renames) =>
			configurationSchemas().pipe(
				Effect.flatMap((configurationSchema) =>
					Effect.all(
						configurationSchema.flatMap((schema) =>
							changesetForLocalSchema(schema, configurationSchema, renames),
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

type Renames = {
	tablesToRename: {
		from: string;
		to: string;
	}[];
	columnsToRename: ColumnsToRename;
};

function schemaRenamePrompt() {
	return Effect.gen(function* () {
		const schemas = yield* configurationSchemas();
		const all: Renames = {
			tablesToRename: [],
			columnsToRename: {},
		};
		for (const schema of schemas) {
			const introspectionContext = yield* introspectSchemas(schema, schemas);
			yield* selectTableDiffChoicesInteractive(introspectionContext);
			yield* selectColumnDiffChoicesInteractive(introspectionContext);
			all.tablesToRename.push(...introspectionContext.tablesToRename);
			Object.assign(all.columnsToRename, introspectionContext.columnsToRename);
		}
		return yield* Effect.succeed(all);
	});
}

function changesetForLocalSchema(
	localSchema: AnySchema,
	allSchemas: AnySchema[],
	renames: Renames,
) {
	return context(localSchema).pipe(
		Effect.tap(() => validateForeignKeyReferences(localSchema, allSchemas)),
		Effect.flatMap(() =>
			introspectSchemas(localSchema, allSchemas).pipe(
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
