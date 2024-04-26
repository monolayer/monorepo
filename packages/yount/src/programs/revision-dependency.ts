import { Effect } from "effect";
import { allMigrations } from "./all-migrations.js";

export function revisionDependency() {
	return Effect.gen(function* (_) {
		const allRevisions = yield* _(allMigrations());
		const migrationsNames = allRevisions.map((m) => m.name);
		return migrationsNames.slice(-1)[0] ?? "NO_DEPENDENCY";
	});
}
