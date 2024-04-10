import * as p from "@clack/prompts";
import { Effect } from "effect";
import color from "picocolors";
import type { DevEnvironment, Environment } from "../services/environment.js";
import type { Db, DevDb } from "../services/kysely.js";
import type { Migrator } from "../services/migrator.js";
import type { DevPg, Pg } from "../services/pg.js";

export function spinnerTask(
	name: string,
	callback: () => Effect.Effect<
		unknown,
		unknown,
		Environment | DevEnvironment | Db | DevDb | Migrator | Pg | DevPg
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
				return Effect.unit;
			}),
		)
		.pipe(Effect.flatMap(() => Effect.succeed(true)));
}

export function check(
	name: string,
	callback: () => Effect.Effect<
		boolean,
		unknown,
		Environment | DevEnvironment | Db | DevDb | Migrator | Pg | DevPg
	>,
) {
	return Effect.succeed(p.spinner()).pipe(
		Effect.tap((spinner) => spinner.start()),
		Effect.flatMap((spinner) =>
			callback().pipe(
				Effect.tap((result) =>
					Effect.if(result, {
						onTrue: Effect.succeed(true).pipe(
							Effect.tap(() => spinner.stop(`${name} ${color.green("✓")}`)),
						),
						onFalse: Effect.succeed(false).pipe(
							Effect.tap(() => spinner.stop(`${name} ${color.red("x")}`)),
						),
					}),
				),
			),
		),
	);
}
