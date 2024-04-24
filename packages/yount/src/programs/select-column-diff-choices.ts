import { Effect } from "effect";
import { SchemaMigrationInfo } from "~/introspection/introspection.js";
import { columnDiffPrompt } from "../prompts/column-diff.js";
import { PromptCancelError } from "./cli-action.js";
import { IntrospectionContext } from "./introspect-schemas.js";

export function selectColumnDiffChoicesInteractive(
	context: IntrospectionContext,
) {
	return Effect.gen(function* (_) {
		const diff = yield* _(columnDiff(context.local, context.remote));
		const columnsToRename = yield* _(
			Effect.tryPromise(() => columnDiffPrompt(diff)).pipe(
				Effect.flatMap((columnDiffResult) => {
					if (typeof columnDiffResult === "symbol") {
						return Effect.fail(new PromptCancelError());
					} else {
						return Effect.succeed(columnDiffResult);
					}
				}),
			),
		);
		context.columnsToRename = columnsToRename;
		return yield* _(Effect.succeed(columnsToRename));
	});
}

export function columnDiff(
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
