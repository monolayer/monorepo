import { select } from "@clack/prompts";
import { PromptCancelError } from "@monorepo/cli/errors.js";
import { Context, Effect, Layer, Ref } from "effect";
import { flatMap } from "effect/Effect";
import color from "picocolors";

export function tableRenames(
	tableDiff: {
		added: string[];
		deleted: string[];
	},
	schemaName: string,
) {
	return Effect.gen(function* () {
		const current = yield* TableRenameState.current;
		if (current.tableRenames) {
			return current.tableRenames;
		}
		if (tableDiff.added.length === 0 || tableDiff.deleted.length === 0) {
			return [];
		}
		for (const table of tableDiff.added) {
			const tableOp = yield* selectRename({
				table,
				schemaName,
				deletedTables: tableDiff.deleted,
			});
			const renameMatch = tableOp.match(/^rename:(\w+):(\w+)/);
			if (renameMatch !== null) {
				yield* Ref.update(yield* TableRenameState, (state) => {
					if (state.tableRenames == undefined) {
						state.tableRenames = [];
					}
					state.tableRenames.push({
						from: `${schemaName}.${renameMatch[1]}`,
						to: `${schemaName}.${renameMatch[2]}`,
					});
					return state;
				});
				tableDiff.deleted.splice(tableDiff.deleted.indexOf(renameMatch[1]!), 1);
			}
			if (tableDiff.deleted.length === 0) {
				return (yield* Ref.get(yield* TableRenameState)).tableRenames ?? [];
			}
		}
		return (yield* Ref.get(yield* TableRenameState)).tableRenames ?? [];
	});
}

type TableRenameSelection = {
	value: string;
	label: string;
}[];

export function selectRename({
	table,
	schemaName,
	deletedTables,
}: {
	table: string;
	schemaName: string;
	deletedTables: string[];
}) {
	return Effect.gen(function* () {
		const result = yield* Effect.tryPromise(() =>
			select<TableRenameSelection, string>({
				message: `Do you want to create the table '${table}' in the '${schemaName}' schema or rename an existing table?`,
				options: [
					{
						value: `create:${table}`,
						label: `${color.green("create")} '${table}'`,
					},
					...deletedTables.map((deletedTable) => {
						return {
							value: `rename:${deletedTable}:${table}`,
							label: `${color.yellow("rename")} ${deletedTable} ${color.yellow("~>")} ${table}`,
						};
					}),
				],
			}),
		);
		if (typeof result === "symbol") {
			return yield* Effect.fail(new PromptCancelError());
		} else {
			return result;
		}
	});
}

export interface TableRename {
	from: string;
	to: string;
}

export class TableRenameState extends Context.Tag("TableRenameState")<
	TableRenameState,
	Ref.Ref<{ tableRenames?: TableRename[] }>
>() {
	static current = TableRenameState.pipe(
		flatMap((tableRenameState) => Ref.get(tableRenameState)),
	);
	static provide<A, E, R>(
		effect: Effect.Effect<A, E, R>,
		initialState?: TableRename[],
	) {
		return Effect.provide(
			effect,
			Layer.effect(
				TableRenameState,
				Ref.make(initialState ? { tableRenames: initialState } : {}),
			),
		);
	}
}
