import { Effect } from "effect";
import type { Kysely } from "kysely";
import type { CamelCaseOptions } from "~/configuration.js";
import { Schema, type AnySchema } from "~/database/schema/schema.js";
import type {
	ColumnsToRename,
	TablesToRename,
} from "../introspection/introspect-schemas.js";
import { DbClients } from "../services/db-clients.js";
import { DevEnvironment } from "../services/environment.js";

export type ChangesetContext = {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	kyselyInstance: Kysely<any>;
	camelCasePlugin: CamelCaseOptions;
	schemaName: string;
	localSchema: AnySchema;
	tablesToRename: TablesToRename;
	columnsToRename: ColumnsToRename;
};

export function context(schema: AnySchema) {
	return Effect.all([DevEnvironment, DbClients]).pipe(
		Effect.flatMap(([devEnvironment, dbClients]) => {
			const context: ChangesetContext = {
				kyselyInstance: dbClients.developmentEnvironment.kyselyNoCamelCase,
				camelCasePlugin: devEnvironment.camelCasePlugin || { enabled: false },
				schemaName: Schema.info(schema).name || "public",
				localSchema: schema,
				tablesToRename: [],
				columnsToRename: {},
			};
			return Effect.succeed(context);
		}),
	);
}
