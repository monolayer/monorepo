import * as p from "@clack/prompts";
import { Effect } from "effect";
import color from "picocolors";
import type { ProgramContext } from "../program-context.js";

export function spinnerTask(
	name: string,
	callback: () => Effect.Effect<unknown, unknown, ProgramContext>,
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

export function check(
	name: string,
	callback: () => Effect.Effect<boolean, unknown, ProgramContext>,
) {
	return Effect.succeed(p.spinner()).pipe(
		Effect.tap((spinner) => spinner.start()),
		Effect.flatMap((spinner) =>
			callback().pipe(
				Effect.tap((result) =>
					Effect.if(result, {
						onTrue: () =>
							Effect.succeed(true).pipe(
								Effect.tap(() => spinner.stop(`${name} ${color.green("✓")}`)),
							),
						onFalse: () =>
							Effect.succeed(false).pipe(
								Effect.tap(() => spinner.stop(`${name} ${color.red("x")}`)),
							),
					}),
				),
			),
		),
	);
}
