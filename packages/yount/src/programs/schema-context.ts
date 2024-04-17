import { Effect } from "effect";
import type { Kysely } from "kysely";
import type { CamelCaseOptions } from "~/configuration.js";
import { Schema, type AnySchema } from "~/database/schema/schema.js";
import { DbClients } from "../services/dbClients.js";
import { DevEnvironment } from "../services/environment.js";
import type { ColumnsToRename } from "./column-diff-prompt.js";
import type { TablesToRename } from "./table-diff-prompt.js";

export type SchemaContext = {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	kyselyInstance: Kysely<any>;
	camelCasePlugin: CamelCaseOptions;
	schemaName: string;
	localSchema: AnySchema;
	tablesToRename: TablesToRename;
	columnsToRename: ColumnsToRename;
};

export function schemaContext(localSchema: AnySchema) {
	return Effect.all([DevEnvironment, DbClients]).pipe(
		Effect.flatMap(([devEnvironment, dbClients]) => {
			const context: SchemaContext = {
				kyselyInstance: dbClients.developmentEnvironment.kyselyNoCamelCase,
				camelCasePlugin: devEnvironment.camelCasePlugin || { enabled: false },
				schemaName: Schema.info(localSchema).name || "public",
				localSchema: localSchema,
				tablesToRename: [],
				columnsToRename: {},
			};
			return Effect.succeed(context);
		}),
	);
}
