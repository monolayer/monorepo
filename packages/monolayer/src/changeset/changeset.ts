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
	type SchemaIntrospection,
} from "../introspection/introspect-schemas.js";
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
	return Effect.succeed(true).pipe(
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

function computeChangeset(introspectionContext: SchemaIntrospection) {
	return appEnvironmentCamelCasePlugin.pipe(
		Effect.flatMap((camelCasePlugin) =>
			Effect.succeed(schemaChangeset(introspectionContext, camelCasePlugin)),
		),
	);
}

// export function changeset() {
// 	return Effect.gen(function* () {
// 		const renames = yield* promptSchemaRenames;
// 		const allSchemas = yield* appEnvironmentConfigurationSchemas;
// 		const camelCasePlugin = yield* appEnvironmentCamelCasePlugin;

// 		let changesets: Changeset[] = [];

// 		for (const schema of allSchemas) {
// 			yield* validateForeignKeyReferences(schema, allSchemas);
// 			const introspection = yield* schemaIntrospection(schema, renames);
// 			const changeset = schemaChangeset(introspection, camelCasePlugin);
// 			changesets = [...changesets, ...changeset];
// 		}

// 		return changesets;
// 	});
// }

// function schemaIntrospection(
// 	schema: AnySchema,
// 	renames: TableAndColumnRenames,
// ) {
// 	return Effect.gen(function* () {
// 		const introspection = yield* introspectSchema(schema);
// 		yield* renameMigrationInfo(introspection, renames);
// 		yield* renameMigrationInfo(introspection, renames);
// 		yield* sortTablePriorities(introspection, renames);
// 		return introspection;
// 	});
// }
