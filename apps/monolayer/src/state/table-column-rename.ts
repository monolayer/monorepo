import { Context, Effect, Ref } from "effect";

export interface TableRename {
	from: string;
	to: string;
}

export interface ColumnsToRename
	extends Record<
		string,
		{
			from: string;
			to: string;
		}[]
	> {}

export interface TableAndColumnRenames {
	tablesToRename: Array<TableRename>;
	columnsToRename: ColumnsToRename;
}

export class TableColumnRenameState extends Context.Tag(
	"TableColumnRenameState",
)<TableColumnRenameState, Ref.Ref<TableAndColumnRenames>>() {
	static get current() {
		return Effect.gen(function* () {
			return yield* Ref.get(yield* TableColumnRenameState);
		});
	}

	static updateTablesToRename(tablesToRename: TableRename[]) {
		return Effect.gen(function* () {
			yield* Ref.update(yield* TableColumnRenameState, (state) => {
				return {
					...state,
					tablesToRename: [...state.tablesToRename, ...tablesToRename],
				};
			});
		});
	}

	static updateColumnsToRename(columnsToRename: ColumnsToRename) {
		return Effect.gen(function* () {
			yield* Ref.update(yield* TableColumnRenameState, (state) => {
				return {
					...state,
					columnsToRename: {
						...state.columnsToRename,
						...columnsToRename,
					},
				};
			});
		});
	}
}

export const makeTableColumnRenameState = Ref.make<TableAndColumnRenames>({
	tablesToRename: [],
	columnsToRename: {},
});
