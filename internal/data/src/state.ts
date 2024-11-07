import { Context, Effect, Layer, Ref } from "effect";
import { flatMap } from "effect/Effect";

export interface DataCLIOptions {
	folder?: string;
}

export class DataCLIState extends Context.Tag("DataCLIState")<
	DataCLIState,
	Ref.Ref<DataCLIOptions>
>() {
	static current = DataCLIState.pipe(flatMap((state) => Ref.get(state)));

	static provide<A, E, R>(
		effect: Effect.Effect<A, E, R>,
		initialState: DataCLIOptions,
	) {
		return Effect.provide(
			effect,
			Layer.effect(DataCLIState, Ref.make(initialState)),
		);
	}
}
