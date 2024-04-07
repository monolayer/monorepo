import * as p from "@clack/prompts";
import { Effect } from "effect";
import path from "path";
import color from "picocolors";
import { localPendingMigrations } from "./local-pending-migrations.js";

export function pendingMigrations() {
	return localPendingMigrations().pipe(
		Effect.tap((pendingMigrations) =>
			Effect.if(pendingMigrations.length > 0, {
				onTrue: Effect.forEach(pendingMigrations, logPendingMigration),
				onFalse: logEmptyMigration(),
			}),
		),
		Effect.flatMap((pendingMigrations) => Effect.succeed(pendingMigrations)),
	);
}

function logEmptyMigration() {
	return Effect.unit.pipe(
		Effect.tap(() => p.log.info(`${color.green("No pending migrations")}`)),
	);
}

function logPendingMigration(migration: { name: string; path: string }) {
	const relativePath = path.relative(process.cwd(), migration.path);
	p.log.warn(`${color.yellow("pending")} ${relativePath}`);
	return Effect.unit;
}
