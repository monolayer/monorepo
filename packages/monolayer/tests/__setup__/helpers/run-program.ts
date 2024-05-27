import { Effect } from "effect";
import type { DbClients } from "~/services/db-clients.js";
import type { Migrator } from "~/services/migrator.js";
import type { AppEnvironment } from "~/state/app-environment.js";

export function programWithErrorCause<
	T extends Effect.Effect<
		unknown,
		unknown,
		AppEnvironment | Migrator | DbClients
	>,
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
