import { introspectLocalSchema } from "@monorepo/pg/introspection/introspection/introspection.js";
import type { SchemaMigrationInfo } from "@monorepo/pg/schema/column/types.js";
import { type AnySchema, Schema } from "@monorepo/pg/schema/schema.js";
import { appEnvironmentCamelCasePlugin } from "@monorepo/state/app-environment.js";
import { Effect } from "effect";

export function introspectLocal(
	schema: AnySchema,
	remote: SchemaMigrationInfo,
	allSchemas: AnySchema[],
) {
	return Effect.gen(function* () {
		const camelCase = yield* appEnvironmentCamelCasePlugin;
		const schemaName = Schema.info(schema).name || "public";
		return introspectLocalSchema(
			schema,
			remote,
			camelCase,
			[],
			{},
			schemaName,
			allSchemas,
		);
	});
}
