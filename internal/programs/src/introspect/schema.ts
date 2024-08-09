import type { TablesToRename } from "@monorepo/pg/introspection/schema.js";
import type { SchemaMigrationInfo } from "@monorepo/pg/schema/column/types.js";
import { Schema, type AnySchema } from "@monorepo/pg/schema/schema.js";
import { appEnvironmentConfigurationSchemas } from "@monorepo/state/app-environment.js";
import type {
	ColumnsToRename,
	TableAndColumnRenames,
} from "@monorepo/state/table-column-rename.js";
import { Effect } from "effect";
import type { SplitColumnRefactoring } from "../schema-refactor.js";
import { introspectLocal } from "./local-schema.js";
import { introspectRemote } from "./remote-schema.js";

export function introspectSchema(
	schema: AnySchema,
	renames?: TableAndColumnRenames,
	splitRefactors?: SplitColumnRefactoring[],
) {
	return Effect.gen(function* () {
		const allSchemas = yield* appEnvironmentConfigurationSchemas;

		const schemaName = Schema.info(schema).name || "public";
		const introspectedRemote = yield* introspectRemote(
			schemaName,
			renames ?? { tablesToRename: [], columnsToRename: {} },
			false,
		);

		const introspectedLocalSchema = yield* introspectLocal(
			schema,
			introspectedRemote,
			allSchemas,
		);

		const localTables = Object.keys(introspectedLocalSchema.table);
		const remoteTables = Object.keys(introspectedRemote.table);
		const tableDiff = {
			added: localTables.filter((table) => !remoteTables.includes(table)),
			deleted: remoteTables.filter((table) => !localTables.includes(table)),
		};

		const introspectionContext: SchemaIntrospection = {
			schema,
			schemaName: Schema.info(schema).name || "public",
			local: introspectedLocalSchema,
			remote: introspectedRemote,
			tableDiff,
			tablesToRename: renames !== undefined ? renames.tablesToRename : [],
			tablePriorities: introspectedRemote.tablePriorities,
			columnsToRename: renames !== undefined ? renames.columnsToRename : {},
			allSchemas,
			splitRefactors: splitRefactors ?? [],
		};
		return introspectionContext;
	});
}

export type SchemaIntrospection = {
	schema: AnySchema;
	allSchemas: AnySchema[];
	schemaName: string;
	local: SchemaMigrationInfo;
	remote: SchemaMigrationInfo;
	tableDiff: {
		added: string[];
		deleted: string[];
	};
	tablesToRename: TablesToRename;
	tablePriorities: string[];
	columnsToRename: ColumnsToRename;
	splitRefactors: SplitColumnRefactoring[];
};
