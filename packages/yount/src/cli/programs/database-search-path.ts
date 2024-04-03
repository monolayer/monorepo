import { Effect } from "effect";
import type { Pool } from "pg";
import { pgQuery } from "./pg-query.js";

export function databaseSearchPath(pool: Pool) {
	return Effect.gen(function* (_) {
		const result = yield* _(
			pgQuery<{
				search_path: string;
			}>(pool, "SHOW search_path"),
		);
		if (result[0] === undefined) {
			return yield* _(Effect.fail(new Error("Search path not found")));
		} else {
			return yield* _(Effect.succeed(result[0].search_path));
		}
	});
}
