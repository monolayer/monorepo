import { PromptCancelError } from "@monorepo/cli/errors.js";
import type { SchemaMigrationInfo } from "@monorepo/pg/schema/column/types.js";
import { appEnvironmentConfigurationSchemas } from "@monorepo/state/app-environment.js";
import {
	makeTableColumnRenameState,
	TableColumnRenameState,
	type ColumnsToRename,
} from "@monorepo/state/table-column-rename.js";
import { Effect } from "effect";
import { columnsToRenamePrompt } from "~programs/columns-to-rename.js";
import { introspectSchema } from "~programs/introspect-schemas.js";
import { RenameState, tableRenames } from "~programs/table-renames.js";

export function promptSchemaRenames() {
	return Effect.provideServiceEffect(
		Effect.gen(function* () {
			const schemas = yield* appEnvironmentConfigurationSchemas;
			for (const schema of schemas) {
				const introspection = yield* introspectSchema(schema);
				yield* selectTableDiffInteractive(
					introspection.schemaName,
					introspection.tableDiff,
				);
				const columnDiff = yield* computeColumnDiff(
					introspection.local,
					introspection.remote,
				);
				yield* selectColumnDiffInteractive(
					introspection.schemaName,
					columnDiff,
				);
			}
			return yield* TableColumnRenameState.current;
		}),
		TableColumnRenameState,
		makeTableColumnRenameState,
	);
}

function selectTableDiffInteractive(
	schemaName: string,
	{ added = [], deleted = [] }: { added: string[]; deleted: string[] },
) {
	return Effect.gen(function* () {
		if (deleted.length === 0 || added.length === 0) return yield* Effect.void;

		const renameSelection = yield* tableRenames({ added, deleted }, schemaName);

		yield* RenameState.updateTableRenames({ tableRenames: renameSelection });
		if (typeof renameSelection === "symbol")
			return yield* Effect.fail(new PromptCancelError());
		return yield* Effect.void;
	});
}

function selectColumnDiffInteractive(
	schemaName: string,
	diff: Record<
		string,
		{
			added: string[];
			deleted: string[];
		}
	>,
) {
	return Effect.gen(function* () {
		const renameSelection = yield* columnsToRenamePrompt(schemaName, diff);

		yield* RenameState.updateColumnRenames(
			Object.entries(renameSelection).reduce((acc, [tableName, columns]) => {
				acc[`${schemaName}.${tableName}`] = columns;
				return acc;
			}, {} as ColumnsToRename),
		);
		return yield* Effect.void;
	});
}

function computeColumnDiff(
	local: SchemaMigrationInfo,
	remote: SchemaMigrationInfo,
) {
	const localEntries = Object.entries(local.table);
	const diff = localEntries.reduce(
		(acc, [tableName, table]) => {
			const remoteTable = remote.table[tableName];
			if (remoteTable === undefined) {
				return acc;
			}
			const localColumns = Object.keys(table.columns);
			const remoteColumns = Object.keys(remoteTable.columns);
			const added = localColumns.filter(
				(column) => !remoteColumns.includes(column),
			);
			const deleted = remoteColumns.filter(
				(column) => !localColumns.includes(column),
			);
			acc[tableName] = { added, deleted };
			return acc;
		},
		{} as Record<string, { added: string[]; deleted: string[] }>,
	);
	return Effect.succeed(diff);
}
