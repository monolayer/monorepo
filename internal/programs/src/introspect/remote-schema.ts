import { toSnakeCase } from "@monorepo/pg/helpers/to-snake-case.js";
import type { BuilderContext } from "@monorepo/pg/introspection/introspection/foreign-key-builder.js";
import { introspectRemoteSchema } from "@monorepo/pg/introspection/introspection/introspection.js";
import { DbClients } from "@monorepo/services/db-clients.js";
import { appEnvironmentCamelCasePlugin } from "@monorepo/state/app-environment.js";
import type { TableAndColumnRenames } from "@monorepo/state/table-column-rename.js";
import { Effect } from "effect";

export function introspectRemote(
	schemaName: string,
	renames: TableAndColumnRenames,
	external = false,
) {
	return Effect.gen(function* () {
		const kysely = (yield* DbClients).kyselyNoCamelCase;
		const camelCase = yield* appEnvironmentCamelCasePlugin;
		const currentSchemaName = toSnakeCase(schemaName, camelCase);
		const builderContext: BuilderContext = {
			camelCase,
			tablesToRename: renames !== undefined ? renames.tablesToRename : [],
			columnsToRename: renames !== undefined ? renames.columnsToRename : {},
			schemaName: currentSchemaName,
			external,
			skip: {},
		};

		return yield* Effect.tryPromise(() =>
			introspectRemoteSchema(kysely, currentSchemaName, builderContext),
		);
	});
}
