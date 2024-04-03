import { Effect } from "effect";
import { environmentPool } from "~/cli/programs/environment-pool.js";
import { pgQuery } from "../programs/pg-query.js";
import { cliAction } from "../utils/cli-action.js";
import { spinnerTask } from "../utils/spinner-task.js";

export async function dbCreate(environment: string) {
	await cliAction("yount db:create", [
		environmentPool(environment).pipe(
			Effect.tap((poolAndConfig) => {
				const database = poolAndConfig.pg.config.database;
				const pool = poolAndConfig.pg.adminPool;
				return spinnerTask(`Create database ${database}`, () =>
					pgQuery(pool, `CREATE DATABASE ${database};`),
				);
			}),
		),
	]);
}
