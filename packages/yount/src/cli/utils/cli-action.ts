import * as p from "@clack/prompts";
import { Effect, Layer } from "effect";
import { TaggedClass } from "effect/Data";
import color from "picocolors";
import { exit } from "process";
import {
	devEnvironmentLayer,
	environmentLayer,
	type DevEnvironment,
	type Environment,
} from "../services/environment.js";
import {
	devKyselyLayer,
	kyselyLayer,
	type Db,
	type DevDb,
} from "../services/kysely.js";
import { migratorLayer, type Migrator } from "../services/migrator.js";
import { devPgLayer, pgLayer, type DevPg, type Pg } from "../services/pg.js";

export class ExitWithSuccess extends TaggedClass("ExitWithSuccess")<{
	readonly cause: string;
}> {}

export async function cliAction(
	name: string,
	options: { readonly environment: string; readonly connection?: string },
	tasks: Effect.Effect<
		unknown,
		unknown,
		Environment | DevEnvironment | Db | DevDb | Migrator | Pg | DevPg
	>[],
) {
	const layers = migratorLayer().pipe(
		Layer.provideMerge(kyselyLayer()),
		Layer.provideMerge(devKyselyLayer()),
		Layer.provideMerge(pgLayer()),
		Layer.provideMerge(devPgLayer()),
		Layer.provideMerge(
			environmentLayer(options.environment, options.connection ?? "default"),
		),
		Layer.provideMerge(devEnvironmentLayer(options.connection ?? "default")),
	);

	const action = Effect.succeed(true)
		.pipe(
			Effect.tap(() => {
				p.intro(name);
				return Effect.succeed(true);
			}),
		)
		.pipe(
			Effect.tap(() =>
				Effect.provide(Effect.all(tasks), layers).pipe(
					Effect.catchTags({
						ExitWithSuccess: () => Effect.succeed(1),
					}),
				),
			),
		)
		.pipe(
			Effect.tapErrorCause((cause) => {
				if (cause._tag === "Fail") {
					const error = cause.error;
					if (error instanceof Error) {
						if (error.name === "UnknownException") {
							console.dir(error.name);
							const match = error.message.match(
								/database "\w+" does not exist/,
							);
							console.dir(match);
						}
					}
				}
				p.log.message(cause.toString());
				return Effect.unit;
			}),
		);

	await Effect.runPromise(Effect.scoped(action)).then(
		() => {
			p.outro(`${color.green("Done")}`);
			exit(0);
		},
		() => {
			p.outro(`${color.red("Failed")}`);
			exit(1);
		},
	);
}
