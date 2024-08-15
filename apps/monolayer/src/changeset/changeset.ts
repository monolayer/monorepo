import {
	dropSchemaMigration,
	type DropSchemaDiff,
} from "@monorepo/pg/changeset/generators/schema.js";
import { schemaChangeset } from "@monorepo/pg/changeset/schema-changeset.js";
import type { Changeset } from "@monorepo/pg/changeset/types.js";
import { toSnakeCase } from "@monorepo/pg/helpers/to-snake-case.js";
import { managedSchemas } from "@monorepo/pg/introspection/database-schemas.js";
import { Schema, type AnySchema } from "@monorepo/pg/schema/schema.js";
import { introspectAlignment } from "@monorepo/programs/introspect/alignment.js";
import { promtSchemaRefactors } from "@monorepo/programs/schema-refactor.js";
import { promptSchemaRenames } from "@monorepo/programs/schema-rename.js";
import { DbClients } from "@monorepo/services/db-clients.js";
import {
	appEnvironmentCamelCasePlugin,
	appEnvironmentConfigurationSchemas,
} from "@monorepo/state/app-environment.js";
import { Effect } from "effect";
import {
	introspectSchema,
	renameMigrationInfo,
	sortTablePriorities,
} from "~monolayer/changeset/introspect-schemas.js";
import { validateForeignKeyReferences } from "~monolayer/changeset/validate-foreign-key-references.js";

export function changeset() {
	return Effect.gen(function* () {
		const splitRefactors = yield* promtSchemaRefactors;
		const renames = yield* promptSchemaRenames([]);
		const allSchemas = yield* appEnvironmentConfigurationSchemas;
		let changesets: Changeset[] = [];
		const typeAlignments = yield* introspectAlignment;
		for (const schema of allSchemas) {
			yield* validateForeignKeyReferences(schema, allSchemas);
			const introspection = yield* introspectSchema(
				schema,
				renames,
				splitRefactors,
			);
			yield* renameMigrationInfo(introspection);
			yield* sortTablePriorities(introspection);
			changesets = [
				...changesets,
				...schemaChangeset(
					introspection,
					yield* appEnvironmentCamelCasePlugin,
					typeAlignments,
				),
			];
		}
		return [...changesets, ...(yield* dropSchemaChangeset(allSchemas))];
	});
}

function dropSchemaChangeset(schemas: AnySchema[]) {
	return Effect.gen(function* () {
		const camelCase = yield* appEnvironmentCamelCasePlugin;
		const schemasToDrop = (yield* monolayerSchemasInDb()).filter(
			(dbSchema) =>
				!schemas.find((schema) => {
					return (
						toSnakeCase(Schema.info(schema).name ?? "public", camelCase) ===
						dbSchema.name
					);
				}),
		);
		const changesets: Changeset[] = [];

		for (const schema of schemasToDrop) {
			const diff = {
				type: "REMOVE",
				path: ["schemaInfo", schema.name],
				oldValue: true,
			} satisfies DropSchemaDiff;
			const changeset = dropSchemaMigration(diff);
			changesets.push(changeset);
		}
		return changesets;
	});
}

function monolayerSchemasInDb() {
	return Effect.gen(function* () {
		const kysely = (yield* DbClients).kyselyNoCamelCase;
		return yield* Effect.tryPromise(async () => {
			const dbManagedSchemas = await managedSchemas(kysely);
			return dbManagedSchemas;
		});
	});
}
