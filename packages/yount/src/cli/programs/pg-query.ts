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
>(query: string) {
	return Pg.pipe(
		Effect.flatMap((pg) =>
			Effect.promise(async () => {
				const result = await pg.adminPool.query<T>(query);
				return result.rows;
			}),
		),
	);
}

export function adminDevPgQuery<
	T extends QueryResultRow = Record<string, unknown>,
>(query: string) {
	return DevPg.pipe(
		Effect.flatMap((pg) =>
			Effect.promise(async () => {
				const result = await pg.adminPool.query<T>(query);
				return result.rows;
			}),
		),
	);
}
