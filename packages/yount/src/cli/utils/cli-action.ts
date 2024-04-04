import * as p from "@clack/prompts";
import { Effect, Layer } from "effect";
import { TaggedClass } from "effect/Data";
import color from "picocolors";
import { exit } from "process";
import { environmentLayer, type Environment } from "../services/environment.js";
import { kyselyLayer, type Db } from "../services/kysely.js";
import { migratorLayer, type Migrator } from "../services/migrator.js";

export class ExitWithSuccess extends TaggedClass("ExitWithSuccess")<{
	readonly cause: string;
}> {}

export function abortEarlyWithSuccess(message: string) {
	return Effect.gen(function* (_) {
		p.log.info(message);
		yield* _(
			Effect.fail(
				new ExitWithSuccess({
					cause: "abortEarlyWithSuccess",
				}),
			),
		);
	});
}

export async function cliAction(
	name: string,
	environment: string,
	tasks: Effect.Effect<unknown, unknown, Environment | Db | Migrator>[],
) {
	const layers = migratorLayer().pipe(
		Layer.provideMerge(kyselyLayer()),
		Layer.provideMerge(environmentLayer(environment)),
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
