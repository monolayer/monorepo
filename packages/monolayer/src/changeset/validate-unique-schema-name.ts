import { Effect } from "effect";
import { Schema, type AnySchema } from "~/database/schema/schema.js";

export function validateUniqueSchemaName(allSchemas: AnySchema[]) {
	return Effect.gen(function* () {
		const uniqueSchemaNames = new Set();
		const schemaNames = allSchemas.map((schema) => Schema.info(schema).name);

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
