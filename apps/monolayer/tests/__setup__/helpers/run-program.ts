import type { DbClients } from "@monorepo/services/db-clients.js";
import type { Migrator } from "@monorepo/services/migrator.js";
import {
	AppEnvironment,
	type AppEnv,
} from "@monorepo/state/app-environment.js";
import { Effect, Ref } from "effect";
import { loadEnv } from "~/cli-action.js";
import { layers } from "./layers.js";

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

export async function runProgramWithErrorCause<
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	T extends Effect.Effect<any, unknown, AppEnvironment | Migrator | DbClients>,
>(
	program: T,
	env?: AppEnv,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<T extends Effect.Effect<infer A, any, any> ? A : never> {
	return Effect.runPromise(
		Effect.provideServiceEffect(
			Effect.scoped(
				Effect.provide(
					program.pipe(
						Effect.tapErrorCause((cause) => {
							console.log(cause);
							return Effect.void;
						}),
					),
					layers,
				),
			),
			AppEnvironment,
			Ref.make(env ?? (await loadEnv({ databaseId: "default" }))),
		),
	);
}
