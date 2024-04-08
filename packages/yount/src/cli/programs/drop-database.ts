import { Effect } from "effect";
import { Pg } from "../services/pg.js";
import { spinnerTask } from "../utils/spinner-task.js";
import { pgQuery } from "./pg-query.js";

export function dropDatabase(failSafe = false) {
	return Pg.pipe(
		Effect.flatMap((pg) =>
			spinnerTask(`Drop database ${pg.config.database}`, () =>
				pgQuery(
					pg.adminPool,
					`DROP DATABASE ${failSafe ? "IF EXISTS" : ""} "${pg.config.database}";`,
				),
			),
		),
	);
}
