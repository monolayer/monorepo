import * as p from "@clack/prompts";
import { Effect, Layer } from "effect";
import type { Cause } from "effect/Cause";
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
import { cancelOperation } from "./cancel-operation.js";

export class ExitWithSuccess extends TaggedClass("ExitWithSuccess")<{
	readonly cause: string;
}> {}

export class PromptCancelError {
	readonly _tag = "PromptCancelError";
}

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
						PromptCancelError: () => cancelOperation(),
					}),
				),
			),
		)
		.pipe(Effect.tapErrorCause(printCause));

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

function printCause(cause: Cause<unknown>) {
	const error =
		cause._tag === "Die" && cause.defect instanceof Error
			? cause.defect
			: cause._tag === "Fail" && cause.error instanceof Error
				? cause.error
				: undefined;

	if (error !== undefined) {
		p.log.error(`${color.red(error.name)} ${error.message}`);
		const errorStr = JSON.stringify(error, null, 2);
		if (errorStr !== "{}") {
			p.log.message(errorStr);
		}
		p.log.message(error.stack);
	} else {
		p.log.error(color.red("Error"));
		p.log.message(JSON.stringify(cause, null, 2));
	}
	return Effect.void;
}
