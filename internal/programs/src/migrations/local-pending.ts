import { Migrator } from "@monorepo/services/migrator.js";
import { Effect } from "effect";

export const localPendingSchemaMigrations = Effect.gen(function* () {
	const migrator = yield* Migrator;
	const stats = yield* migrator.migrationStats;
	return stats.localPending;
});
