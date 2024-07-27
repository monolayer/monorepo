import { Effect, Ref } from "effect";
import { type DbClients } from "~/services/db-clients.js";
import type { Migrator } from "~/services/migrator.js";
import { AppEnv, AppEnvironment } from "~/state/app-environment.js";
import { loadEnv } from "../../../src/cli/cli-action.js";
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
			Ref.make(env ?? (await loadEnv("development", "default"))),
		),
	);
}
