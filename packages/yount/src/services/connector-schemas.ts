import { Context, Effect, Layer } from "effect";
import { Schema, type AnySchema } from "~/database/schema/schema.js";
import { DevEnvironment } from "./environment.js";

export interface ConnectorSchemasProperties {
	readonly schemas: Record<string, AnySchema>;
}

export class ConnectorSchemas extends Context.Tag("MigrationInfo")<
	ConnectorSchemas,
	ConnectorSchemasProperties
>() {}

export function connectorSchemas() {
	return Layer.effect(
		ConnectorSchemas,
		DevEnvironment.pipe(
			Effect.flatMap((environment) => {
				const schemas = environment.connector.schemas.reduce(
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
