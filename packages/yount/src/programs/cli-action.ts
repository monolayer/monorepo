import * as p from "@clack/prompts";
import { Effect, Layer } from "effect";
import { TaggedClass } from "effect/Data";
import color from "picocolors";
import { exit } from "process";
import type { ProgramContext } from "../program-context.js";
import { dbClientsLayer } from "../services/dbClients.js";
import {
	devEnvironmentLayer,
	environmentLayer,
} from "../services/environment.js";
import { migratorLayer } from "../services/migrator.js";

export class ExitWithSuccess extends TaggedClass("ExitWithSuccess")<{
	readonly cause: string;
}> {}

export async function cliAction(
	name: string,
	options: { readonly environment: string; readonly connection?: string },
	tasks: Effect.Effect<unknown, unknown, ProgramContext>[],
) {
	const layers = migratorLayer().pipe(
		Layer.provideMerge(dbClientsLayer()),
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
