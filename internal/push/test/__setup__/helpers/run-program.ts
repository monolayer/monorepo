import { Effect } from "effect";

export function programWithErrorCause<A, E, R>(
	program: Effect.Effect<A, E, R>,
) {
	return program.pipe(
		Effect.tapErrorCause((cause) => {
			console.dir(cause, { depth: null });
			return Effect.void;
		}),
	);
}
