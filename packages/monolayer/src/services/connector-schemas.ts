import { Context, Effect, Layer } from "effect";
import { Schema, type AnySchema } from "~/database/schema/schema.js";
import { DevEnvironment } from "./environment.js";

export interface ConfigurationSchemasProperties {
	readonly schemas: Record<string, AnySchema>;
}

export class ConfigurationSchemas extends Context.Tag("MigrationInfo")<
	ConfigurationSchemas,
	ConfigurationSchemasProperties
>() {}

export function configurationSchemas() {
	return Layer.effect(
		ConfigurationSchemas,
		DevEnvironment.pipe(
			Effect.flatMap((environment) => {
				const schemas = environment.configuration.schemas.reduce(
					(acc, schema) => {
						const schemaName = Schema.info(schema).name ?? "public";
						acc[schemaName] = schema;
						return acc;
					},
					{} as Record<string, AnySchema>,
				);
				return Effect.succeed({ schemas });
			}),
		),
	);
}
