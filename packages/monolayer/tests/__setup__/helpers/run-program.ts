import { Effect } from "effect";

export function programWithErrorCause<
	T extends Effect.Effect<unknown, unknown, unknown>,
>(program: T) {
	return program.pipe(
		Effect.tapErrorCause((cause) => {
			console.log(cause);
			return Effect.void;
		}),
	) as T extends Effect.Effect<infer A, infer E, infer C>
		? Effect.Effect<A, E, C>
		: never;
}
