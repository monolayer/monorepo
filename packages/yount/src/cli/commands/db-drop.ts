import { Effect } from "effect";
import { environmentPool } from "~/cli/programs/environment-pool.js";
import { pgQuery } from "../programs/pg-query.js";
import { cliAction } from "../utils/cli-action.js";
import { spinnerTask } from "../utils/spinner-task.js";

export async function dbDrop(environment: string) {
	await cliAction("yount db:drop", [
		environmentPool(environment).pipe(
			Effect.tap((poolAndConfig) => {
				const database = poolAndConfig.pg.config.database;
				const pool = poolAndConfig.pg.adminPool;
				return spinnerTask(`Drop database ${database}`, () =>
					pgQuery(pool, `DROP DATABASE ${database};`),
				);
			}),
		),
	]);
}
