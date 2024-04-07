import { Effect } from "effect";
import { Environment } from "../services/environment.js";
import { spinnerTask } from "../utils/spinner-task.js";
import { pgQuery } from "./pg-query.js";

export function dropDatabase(failSafe = false) {
	return Environment.pipe(
		Effect.flatMap((environment) =>
			spinnerTask(`Drop database ${environment.pg.config.database}`, () =>
				pgQuery(
					environment.pg.adminPool,
					`DROP DATABASE ${failSafe ? "IF EXISTS" : ""} "${environment.pg.config.database}";`,
				),
			),
		),
	);
}
