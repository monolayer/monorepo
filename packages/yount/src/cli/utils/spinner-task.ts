import * as p from "@clack/prompts";
import { Effect } from "effect";
import color from "picocolors";
import type { Environment } from "../services/environment.js";
import type { Db } from "../services/kysely.js";
import type { Migrator } from "../services/migrator.js";

export function spinnerTask(
	name: string,
	callback: () => Effect.Effect<unknown, unknown, Environment | Db | Migrator>,
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
		)
		.pipe(Effect.flatMap(() => Effect.succeed(true)));
}

export function check(
	name: string,
	callback: () => Effect.Effect<boolean, unknown, Environment | Db | Migrator>,
) {
	const spinner = p.spinner();
	return Effect.gen(function* (_) {
		spinner.start(name);
		const result = yield* _(callback());
		if (result) {
			spinner.stop(`${name} ${color.green("✓")}`);
		} else {
			spinner.stop(`${name} ${color.red("x")}`);
		}
		return yield* _(Effect.succeed(result));
	});
}
