import { Effect } from "effect";
import { DevPg, Pg } from "../services/pg.js";
import { spinnerTask } from "../utils/spinner-task.js";
import { adminPgQuery } from "./pg-query.js";

export function createDatabase() {
	return Pg.pipe(
		Effect.flatMap((pg) =>
			spinnerTask(`Create database ${pg.config.database}`, () =>
				adminPgQuery(`CREATE DATABASE "${pg.config.database}";`),
			),
		),
	);
}

export function createDevDatabase() {
	return DevPg.pipe(
		Effect.flatMap((pg) =>
			spinnerTask(`Create database ${pg.config.database}`, () =>
				adminPgQuery(`CREATE DATABASE "${pg.config.database}";`, true),
			),
		),
	);
}
