import { Effect } from "effect";
import { Schema } from "~/database/schema/schema.js";
import { appEnvironmentConfigurationSchemas } from "~/state/app-environment.js";

export function validateUniqueSchemaName() {
	return Effect.gen(function* () {
		const schemas = yield* appEnvironmentConfigurationSchemas;
		const uniqueSchemaNames = new Set();
		const schemaNames = schemas.map((schema) => Schema.info(schema).name);

		for (const schemaName of schemaNames) {
			if (uniqueSchemaNames.has(schemaName)) {
				return yield* Effect.fail(new SchemaNameError(schemaName));
			} else {
				uniqueSchemaNames.add(schemaName);
			}
		}
		return yield* Effect.succeed(true);
	});
}

export class SchemaNameError extends TypeError {
	constructor(schemaName: string) {
		super(`Multiple schemas with the same name: '${schemaName}'.`);
	}
}
