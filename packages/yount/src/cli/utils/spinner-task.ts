import * as p from "@clack/prompts";
import { Effect } from "effect";
import color from "picocolors";

export function spinnerTask(
	name: string,
	callback: () => Effect.Effect<unknown, unknown, never>,
) {
	const spinner = p.spinner();
	return Effect.succeed(true)
		.pipe(
			Effect.tap(() => spinner.start(name)),
			Effect.flatMap(callback),
			Effect.tap(() => spinner.stop(`${name} ${color.green("✓")}`)),
		)
		.pipe(
			Effect.tapErrorCause(() => {
				const msg = `${name} ${color.red("x")}`;
				spinner.stop(msg, 1);
				return Effect.unit;
			}),
		);
}
