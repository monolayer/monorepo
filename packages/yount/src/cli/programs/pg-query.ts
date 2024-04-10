import { Effect } from "effect";
import type { QueryResultRow } from "pg";
import { DbClients } from "../services/dbClients.js";

export function pgQuery<T extends QueryResultRow = Record<string, unknown>>(
	query: string,
) {
	return DbClients.pipe(
		Effect.flatMap((clients) =>
			Effect.promise(async () => {
				const result = await clients.currentEnvironment.pgPool.query<T>(query);
				return result.rows;
			}),
		),
	);
}

export function adminPgQuery<
	T extends QueryResultRow = Record<string, unknown>,
>(query: string) {
	return DbClients.pipe(
		Effect.flatMap((clients) =>
			Effect.promise(async () => {
				const result =
					await clients.currentEnvironment.pgAdminPool.query<T>(query);
				return result.rows;
			}),
		),
	);
}

export function adminDevPgQuery<
	T extends QueryResultRow = Record<string, unknown>,
>(query: string) {
	return DbClients.pipe(
		Effect.flatMap((clients) =>
			Effect.promise(async () => {
				const result =
					await clients.developmentEnvironment.pgAdminPool.query<T>(query);
				return result.rows;
			}),
		),
	);
}
