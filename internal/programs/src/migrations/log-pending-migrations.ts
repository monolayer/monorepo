import * as p from "@clack/prompts";
import { Effect } from "effect";
import path from "node:path";
import { cwd } from "node:process";
import color from "picocolors";
import { localPendingSchemaMigrations } from "~programs/migrations/local-pending.js";

export const logPendingMigrations = Effect.gen(function* () {
	const pendingMigrations = yield* localPendingSchemaMigrations;
	if (pendingMigrations.length > 0) {
		yield* Effect.forEach(pendingMigrations, (pending) => {
			p.log.warn(
				`${color.bgYellow(color.black(" PENDING "))} ${path.relative(cwd(), pending.path)} (${pending.phase})`,
			);
			return Effect.void;
		});
	} else {
		p.log.message("No pending migrations.");
	}
});
