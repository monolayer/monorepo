import * as p from "@clack/prompts";
import { Effect } from "effect";
import { TaggedClass } from "effect/Data";
import color from "picocolors";
import { exit } from "process";

export class ExitWithSuccess extends TaggedClass("ExitWithSuccess")<{
	readonly cause: string;
}> {}

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
		.pipe(
			Effect.tap(() =>
				Effect.all(tasks).pipe(
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
