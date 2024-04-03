import * as p from "@clack/prompts";
import { Effect } from "effect";
import color from "picocolors";
import { exit } from "process";

export async function cliAction(
	name: string,
	tasks: Effect.Effect<unknown, unknown, never>[],
) {
	const action = Effect.succeed(true)
		.pipe(
			Effect.tap(() => {
				p.intro(name);
				return Effect.succeed(true);
			}),
		)
		.pipe(Effect.tap(() => Effect.all(tasks)))
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
