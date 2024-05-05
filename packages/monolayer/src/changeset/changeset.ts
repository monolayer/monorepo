import { Effect } from "effect";
import { schemaChangeset } from "~/changeset/schema-changeset.js";
import {
	appEnvironmentCamelCasePlugin,
	appEnvironmentConfigurationSchemas,
} from "~/state/app-environment.js";
import {
	introspectSchema,
	renameMigrationInfo,
	sortTablePriorities,
} from "../introspection/introspect-schemas.js";
import { promptSchemaRenames } from "./schema-rename.js";
import type { Changeset } from "./types.js";
import { validateForeignKeyReferences } from "./validate-foreign-key-references.js";

export function changeset() {
	return Effect.gen(function* () {
		const renames = yield* promptSchemaRenames;
		const allSchemas = yield* appEnvironmentConfigurationSchemas;
		let changesets: Changeset[] = [];
		for (const schema of allSchemas) {
			yield* validateForeignKeyReferences(schema, allSchemas);
			const introspection = yield* introspectSchema(schema, renames);
			yield* renameMigrationInfo(introspection);
			yield* sortTablePriorities(introspection);
			changesets = [
				...changesets,
				...schemaChangeset(introspection, yield* appEnvironmentCamelCasePlugin),
			];
		}
		return changesets;
	});
}
