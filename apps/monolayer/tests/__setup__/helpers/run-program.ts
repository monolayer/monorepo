import type { DbClients } from "@monorepo/services/db-clients.js";
import type { Migrator } from "@monorepo/services/migrator.js";
import {
	AppEnvironment,
	type AppEnv,
} from "@monorepo/state/app-environment.js";
import { Effect, type Layer } from "effect";
import {
	layers,
	loadEnv,
	programWithContextAndServices as originalprogramWithContextAndServices,
} from "~monolayer/cli-action.js";

export async function programWithContextAndServices<
	A,
	E,
	R,
	Rin extends Migrator | DbClients,
>(
	program: Effect.Effect<A, E, R>,
	env?: AppEnv,
	layer?: Layer.Layer<Rin, never, AppEnvironment>,
) {
	return originalprogramWithContextAndServices(
		programWithErrorCause(program),
		env ?? (await loadEnv({ databaseId: "default" })),
		layer ?? layers,
	);
}

export function programWithErrorCause<A, E, R>(program: Effect.Effect<A, E, R>) {
	return program.pipe(
		Effect.tapErrorCause((cause) => {
			console.dir(cause, { depth: null });
			return Effect.void;
		}),
	);
}
