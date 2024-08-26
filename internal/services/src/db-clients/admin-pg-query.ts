import { ActionError } from "@monorepo/cli/errors.js";
import { UnknownException } from "effect/Cause";
import { gen, tryPromise } from "effect/Effect";
import type { QueryResultRow } from "pg";
import { DbClients } from "~services/db-clients.js";

export function adminPgQuery<
	T extends QueryResultRow = Record<string, unknown>,
>(query: string) {
	return gen(function* () {
		const pool = (yield* DbClients).pgAdminPool;
		return yield* tryPromise({
			try: async () => {
				return (await pool.query<T>(query)).rows;
			},
			catch: (error: unknown) => {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const anyError = error as unknown as any;
				if (anyError.code !== undefined && anyError.severity !== undefined) {
					return new ActionError("QueryError", anyError.message);
				}
				return new UnknownException(error);
			},
		});
	});
}
