import * as p from "@clack/prompts";
import { Effect } from "effect";
import path from "path";
import color from "picocolors";
import { localPendingSchemaRevisions } from "./local-pending-schema-revisions.js";

export function pendingRevisions() {
	return localPendingSchemaRevisions().pipe(
		Effect.tap((pendingMigrations) =>
			Effect.if(pendingMigrations.length > 0, {
				onTrue: () => Effect.forEach(pendingMigrations, logPendingRevisions),
				onFalse: () => logNoPendingRevisions(),
			}),
		),
	);
}

function logNoPendingRevisions() {
	return Effect.void.pipe(
		Effect.tap(() => p.log.message("No pending revisions.")),
	);
}

function logPendingRevisions(migration: { name: string; path: string }) {
	p.log.message(
		`${color.yellow("pending")} ${path.basename(migration.path, ".ts")}`,
	);
	return Effect.void;
}
