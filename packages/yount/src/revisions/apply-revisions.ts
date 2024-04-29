import { Effect } from "effect";
import { dumpDatabaseStructure } from "../programs/dump-database-structure.js";
import { migrate } from "../programs/migrate.js";

export function applyRevisions() {
	return Effect.gen(function* (_) {
		const result = yield* _(migrate());
		if (result) {
			yield* _(dumpDatabaseStructure());
		}
		return result;
	});
}
