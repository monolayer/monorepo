import { Effect } from "effect";
import type { Pool, QueryResultRow } from "pg";

export function pgQuery<T extends QueryResultRow = Record<string, unknown>>(
	pool: Pool,
	query: string,
) {
	return Effect.promise(async () => {
		const result = await pool.query<T>(query);
		return result.rows;
	});
}
