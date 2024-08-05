import { Effect } from "effect";
import { promptCancelError } from "~/cli/cli-action.js";
import { introspectSchema } from "~/introspection/introspect-schemas.js";
import type { SchemaMigrationInfo } from "~/introspection/introspection.js";
import { columnDiffPrompt } from "~/prompts/column-diff.js";
import { tableDiffPrompt } from "~/prompts/table-diff.js";
import { appEnvironmentConfigurationSchemas } from "~/state/app-environment.js";
import {
	TableColumnRenameState,
	makeTableColumnRenameState,
	type ColumnsToRename,
} from "~/state/table-column-rename.js";
import type { SplitColumnRefactoring } from "./schema-refactor.js";

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

		const renameSelection = yield* Effect.tryPromise(() =>
			tableDiffPrompt({ added, deleted }, schemaName),
		);
		if (typeof renameSelection === "symbol") return yield* promptCancelError;

		yield* TableColumnRenameState.updateTablesToRename(
			renameSelection.map((tableToRename) => {
				return {
					from: `${schemaName}.${tableToRename.from}`,
					to: `${schemaName}.${tableToRename.to}`,
				};
			}),
		);
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
		const renameSelection = yield* Effect.tryPromise(() =>
			columnDiffPrompt(diff, schemaName),
		);
		if (typeof renameSelection === "symbol") return yield* promptCancelError;

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
