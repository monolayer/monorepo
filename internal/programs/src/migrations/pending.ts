import * as p from "@clack/prompts";
import { Migrator } from "@monorepo/services/migrator.js";
import { Effect } from "effect";
import path from "node:path";
import { cwd } from "node:process";
import color from "picocolors";

export const pendingMigrations = Effect.gen(function* () {
	const migrator = yield* Migrator;
	const stats = yield* migrator.migrationStats;
	return stats.localPending;
});

export const logPendingMigrations = Effect.gen(function* () {
	const pending = yield* pendingMigrations;
	if (pending.length > 0) {
		yield* Effect.forEach(pending, (pending) => {
			p.log.warn(
				`${color.bgYellow(color.black(" PENDING "))} ${path.relative(cwd(), pending.path)} (${pending.phase})`,
			);
			return Effect.void;
		});
	} else {
		p.log.message("No pending migrations.");
	}
});
