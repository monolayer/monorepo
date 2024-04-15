import { Effect } from "effect";
import { Schema, type AnySchema } from "~/database/schema/schema.js";
import { DbClients } from "../services/dbClients.js";
import { DevEnvironment } from "../services/environment.js";

export function schemaContext(localSchema: AnySchema) {
	return Effect.all([DevEnvironment, DbClients]).pipe(
		Effect.flatMap(([devEnvironment, dbClients]) =>
			Effect.succeed({
				kyselyInstance: dbClients.developmentEnvironment.kyselyNoCamelCase,
				camelCasePlugin: devEnvironment.camelCasePlugin || { enabled: false },
				schemaName: Schema.info(localSchema).name || "public",
				localSchema: localSchema,
			}),
		),
	);
}
