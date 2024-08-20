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
import type { SplitColumnRefactoring } from "~programs/schema-refactor.js";
import { tableRenames } from "~programs/table-renames.js";

export function promptSchemaRenames(
	splitColumnRefactors: SplitColumnRefactoring[],
) {
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
				const filteredColumnDiff = Object.entries(columnDiff).reduce(
					(acc, [tableName, addedDeleted]) => {
						if (
							splitColumnRefactors.some(
								(refactor) =>
									refactor.schema === introspection.schemaName &&
									refactor.tableName === tableName,
							)
						) {
							const sourceColumnsForTable = splitColumnRefactors
								.filter(
									(refactor) =>
										refactor.schema === introspection.schemaName &&
										refactor.tableName === tableName,
								)
								.map((refactor) => refactor.sourceColumn);
							const targetColumsForTable = splitColumnRefactors
								.filter(
									(refactor) =>
										refactor.schema === introspection.schemaName &&
										refactor.tableName === tableName,
								)
								.flatMap((refactor) => refactor.targetColumns);
							acc[tableName] = {
								added: addedDeleted.added.filter(
									(added) => !targetColumsForTable.includes(added),
								),
								deleted: addedDeleted.deleted.filter(
									(deleted) => !sourceColumnsForTable.includes(deleted),
								),
							};
						} else {
							acc[tableName] = addedDeleted;
						}
						return acc;
					},
					{} as Record<
						string,
						{
							added: string[];
							deleted: string[];
						}
					>,
				);
				yield* selectColumnDiffInteractive(
					introspection.schemaName,
					filteredColumnDiff,
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

		if (typeof renameSelection === "symbol")
			return yield* Effect.fail(new PromptCancelError());

		yield* TableColumnRenameState.updateTablesToRename(renameSelection);
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

		yield* TableColumnRenameState.updateColumnsToRename(
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
