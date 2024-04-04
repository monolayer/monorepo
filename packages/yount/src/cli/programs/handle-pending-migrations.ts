import * as p from "@clack/prompts";
import { confirm } from "@clack/prompts";
import { Effect, pipe } from "effect";
import { unlinkSync } from "fs";
import color from "picocolors";
import { exit } from "process";
import { localPendingMigrations } from "./local-pending-migrations.js";

export function handlePendingMigrations() {
	return pipe(
		localPendingMigrations(),
		Effect.tap((pending) =>
			Effect.if(pending.length > 0, {
				onTrue: deletePendingAndContinue(pending),
				onFalse: Effect.unit,
			}),
		),
	);
}

function deletePendingAndContinue(
	pendingMigrations: {
		name: string;
		path: string;
	}[],
) {
	return Effect.tryPromise(async () => {
		for (const migration of pendingMigrations) {
			p.log.warn(`${color.yellow("pending")} ${migration.path}`);
		}

		const shouldContinue = await confirm({
			initialValue: false,
			message: `You have pending migrations and ${color.bold(
				"we need to delete them to continue",
			)}. Do you want to proceed?`,
		});

		if (shouldContinue !== true) {
			p.cancel("Operation cancelled.");
			exit(1);
		}

		for (const migration of pendingMigrations) {
			unlinkSync(migration.path);
			p.log.info(`${color.green("removed")} (${migration.path})`);
		}
	});
}
