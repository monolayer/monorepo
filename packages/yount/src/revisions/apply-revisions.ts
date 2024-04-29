import { Effect } from "effect";
import { dumpDatabase } from "../database/dump-database.js";
import { migrate } from "../programs/migrate.js";

export function applyRevisions() {
	return Effect.gen(function* (_) {
		const result = yield* _(migrate());
		if (result) {
			yield* _(dumpDatabase());
		}
		return result;
	});
}
