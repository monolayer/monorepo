import { Effect } from "effect";
import { ActionError } from "~/cli/cli-action.js";
import { Schema } from "~/database/schema/schema.js";
import { appEnvironmentConfigurationSchemas } from "~/state/app-environment.js";

export function validateUniqueSchemaName() {
	return Effect.gen(function* () {
		const schemas = yield* appEnvironmentConfigurationSchemas;
		const uniqueSchemaNames = new Set();
		const schemaNames = schemas.map((schema) => Schema.info(schema).name);

		for (const schemaName of schemaNames) {
			if (uniqueSchemaNames.has(schemaName)) {
				return yield* Effect.fail(
					new ActionError(
						"Schema name error",
						`Multiple schemas with the same name: '${schemaName}'.`,
					),
				);
			} else {
				uniqueSchemaNames.add(schemaName);
			}
		}
		return yield* Effect.succeed(true);
	});
}
