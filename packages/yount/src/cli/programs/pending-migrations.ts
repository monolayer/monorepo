import * as p from "@clack/prompts";
import { Effect } from "effect";
import path from "path";
import color from "picocolors";
import { localPendingMigrations } from "./local-pending-migrations.js";

export function pendingMigrations() {
	return Effect.gen(function* (_) {
		const pendingMigrations = yield* _(localPendingMigrations());
		if (pendingMigrations.length === 0) {
			p.log.info(`${color.green("No pending migrations")}`);
		} else {
			for (const migration of pendingMigrations) {
				const relativePath = path.relative(process.cwd(), migration.path);
				p.log.warn(`${color.yellow("pending")} ${relativePath}`);
			}
		}
	});
}
