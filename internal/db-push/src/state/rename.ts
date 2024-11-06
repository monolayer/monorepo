import { Context, Effect, Layer, Ref } from "effect";
import { flatMap } from "effect/Effect";

export interface TableToRename {
	name: string;
	schema: string;
	table: string;
	from: string;
	to: string;
	type: "tableRename";
}

type QualifiedTableName<
	SchemaName extends string = string,
	TableName extends string = string,
> = `${SchemaName}.${TableName}`;

export type ColumnToRename = {
	name: string;
	schema: string;
	table: string;
	from: string;
	to: string;
	type: "columnRename";
};

export type ColumnsToRename = Record<QualifiedTableName, ColumnToRename[]>;

export type Renames = {
	tables?: TableToRename[];
	columns?: ColumnsToRename;
};

export class RenameState extends Context.Tag("RenameState")<
	RenameState,
	Ref.Ref<Renames>
>() {
	static current = RenameState.pipe(
		flatMap((tableRenameState) => Ref.get(tableRenameState)),
	);
	static provide<A, E, R>(
		effect: Effect.Effect<A, E, R>,
		initialState?: Renames,
	) {
		return Effect.provide(
			effect,
			Layer.effect(RenameState, Ref.make(initialState ? initialState : {})),
		);
	}

	static update = (newState: Renames) =>
		RenameState.pipe(flatMap((state) => Ref.update(state, () => newState)));

	static updateTableRenames = (newState: { tableRenames?: TableToRename[] }) =>
		RenameState.pipe(
			flatMap((state) =>
				Ref.update(state, (current) => {
					return {
						...current,
						...newState,
					};
				}),
			),
		);

	static updateColumnRenames = (newState: ColumnsToRename) =>
		RenameState.pipe(
			flatMap((state) =>
				Ref.update(state, (current) => {
					return {
						...current,
						...{ columns: newState },
					};
				}),
			),
		);
}
