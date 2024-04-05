import { Effect } from "effect";
import { Environment } from "../services/environment.js";
import { spinnerTask } from "../utils/spinner-task.js";
import { pgQuery } from "./pg-query.js";

export function dropDatabase(failSafe = false) {
	return Effect.gen(function* (_) {
		const environment = yield* _(Environment);
		const database = environment.pg.config.database;
		const pool = environment.pg.adminPool;
		return yield* _(
			spinnerTask(`Drop database ${database}`, () =>
				pgQuery(
					pool,
					`DROP DATABASE ${failSafe ? "IF EXISTS" : ""} ${database};`,
				),
			),
		);
	});
}
