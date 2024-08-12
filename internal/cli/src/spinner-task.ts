import * as p from "@clack/prompts";
import { Effect } from "effect";
import color from "picocolors";

export function spinnerTask<E extends object, C extends object>(
	name: string,
	callback: () => Effect.Effect<
		unknown,
		E extends object ? E : never,
		C extends object ? C : never
	>,
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
				return Effect.void;
			}),
		)
		.pipe(Effect.flatMap(() => Effect.succeed(true)));
}