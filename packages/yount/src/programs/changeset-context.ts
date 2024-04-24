import { Effect } from "effect";
import type { Kysely } from "kysely";
import type { CamelCaseOptions } from "~/configuration.js";
import { Schema, type AnySchema } from "~/database/schema/schema.js";
import { DbClients } from "../services/dbClients.js";
import { DevEnvironment } from "../services/environment.js";
import type { ColumnsToRename, TablesToRename } from "./introspect-schemas.js";

export type ChangesetContext = {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	kyselyInstance: Kysely<any>;
	camelCasePlugin: CamelCaseOptions;
	schemaName: string;
	localSchema: AnySchema;
	tablesToRename: TablesToRename;
	columnsToRename: ColumnsToRename;
};

export function changesetContext(schema: AnySchema) {
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
