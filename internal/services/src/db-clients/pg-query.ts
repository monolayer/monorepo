import { flatMap, tryPromise } from "effect/Effect";
import type { QueryResultRow } from "pg";
import { DbClients } from "~services/db-clients.js";

export function pgQuery<T extends QueryResultRow = Record<string, unknown>>(
	query: string,
) {
	return DbClients.pipe(
		flatMap((clients) =>
			tryPromise(async () => {
				const result = await clients.pgPool.query<T>(query);
				return result.rows;
			}),
		),
	);
}
