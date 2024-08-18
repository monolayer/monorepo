import * as p from "@clack/prompts";
import type { PendingMigration } from "@monorepo/services/migrator.js";
import { Effect } from "effect";
import path from "node:path";
import { cwd } from "node:process";
import color from "picocolors";

export function logPendingMigrations(pendingMigrations: PendingMigration[]) {
	return Effect.forEach(pendingMigrations, (pending) => {
		p.log.warn(
			`${color.bgYellow(color.black(" PENDING "))} ${path.relative(cwd(), pending.path)} (${pending.phase})`,
		);
		return Effect.void;
	});
}
