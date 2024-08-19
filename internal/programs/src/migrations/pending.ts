import * as p from "@clack/prompts";
import {
	Migrator,
	type PendingMigration,
} from "@monorepo/services/migrator.js";
import { Effect } from "effect";
import { flatMap, forEach, succeed, tap } from "effect/Effect";
import path from "node:path";
import { cwd } from "node:process";
import color from "picocolors";

export const pendingMigrations = Migrator.pipe(
	flatMap((migrator) => migrator.migrationStats),
	flatMap((stats) => succeed(stats.localPending)),
);

export const logPendingMigrations = pendingMigrations.pipe(
	tap((pending) =>
		Effect.if(pending.length > 0, {
			onTrue: () => forEach(pending, logPending),
			onFalse: () => Effect.succeed(p.log.message("No pending migrations.")),
		}),
	),
);

const logPending = (pending: PendingMigration) =>
	Effect.succeed(
		p.log.warn(
			`${color.bgYellow(color.black(" PENDING "))} ${path.relative(cwd(), pending.path)} (${pending.phase})`,
		),
	);
