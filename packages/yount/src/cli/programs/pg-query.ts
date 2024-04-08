import { Effect } from "effect";
import type { QueryResultRow } from "pg";
import { DevPg, Pg } from "../services/pg.js";

export function pgQuery<T extends QueryResultRow = Record<string, unknown>>(
	query: string,
) {
	return Pg.pipe(
		Effect.flatMap((pg) =>
			Effect.promise(async () => {
				const result = await pg.pool.query<T>(query);
				return result.rows;
			}),
		),
	);
}

export function adminPgQuery<
	T extends QueryResultRow = Record<string, unknown>,
>(query: string, dev = false) {
	const base = dev ? DevPg : Pg;
	return base.pipe(
		Effect.flatMap((pg) =>
			Effect.promise(async () => {
				const result = await pg.adminPool.query<T>(query);
				return result.rows;
			}),
		),
	);
}
