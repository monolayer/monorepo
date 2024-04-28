import * as p from "@clack/prompts";
import { Effect } from "effect";
import path from "path";
import color from "picocolors";
import { localPendingSchemaRevisions } from "./local-pending-schema-revisions.js";

export function pendingMigrations() {
	return localPendingSchemaRevisions().pipe(
		Effect.tap((pendingMigrations) =>
			Effect.if(pendingMigrations.length > 0, {
				onTrue: () => Effect.forEach(pendingMigrations, logPendingMigration),
				onFalse: () => logEmptyMigration(),
			}),
		),
		Effect.flatMap((pendingMigrations) => Effect.succeed(pendingMigrations)),
	);
}

function logEmptyMigration() {
	return Effect.void.pipe(
		Effect.tap(() => p.log.message("No pending migrations.")),
	);
}

function logPendingMigration(migration: { name: string; path: string }) {
	p.log.message(
		`${color.yellow("pending")} ${path.basename(migration.path, ".ts")}`,
	);
	return Effect.void;
}
