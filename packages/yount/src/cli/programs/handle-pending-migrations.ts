import * as p from "@clack/prompts";
import { confirm } from "@clack/prompts";
import { Effect } from "effect";
import { unlinkSync } from "fs";
import color from "picocolors";
import { exit } from "process";
import { localPendingMigrations } from "./local-pending-migrations.js";

export function handlePendingMigrations() {
	return localPendingMigrations().pipe(
		Effect.flatMap((pendingMigrations) =>
			Effect.if(pendingMigrations.length > 0, {
				onTrue: logPendingMigrations(pendingMigrations).pipe(
					Effect.flatMap(() =>
						askConfirmationDelete().pipe(
							Effect.flatMap((shouldContinue) =>
								Effect.if(shouldContinue === true, {
									onTrue: deletePendingMigrations(pendingMigrations),
									onFalse: cancelOperation(),
								}),
							),
						),
					),
				),
				onFalse: Effect.succeed(true),
			}),
		),
	);
}

function logPendingMigrations(
	pending: {
		name: string;
		path: string;
	}[],
) {
	return Effect.succeed(true).pipe(
		Effect.tap(() =>
			Effect.forEach(pending, (pendingMigration) =>
				Effect.succeed(
					p.log.warn(`${color.yellow("pending")} ${pendingMigration.path}`),
				),
			),
		),
	);
}

function askConfirmationDelete() {
	return Effect.tryPromise(() =>
		confirm({
			initialValue: false,
			message: `You have pending migrations and ${color.bold(
				"we need to delete them to continue",
			)}. Do you want to proceed?`,
		}),
	);
}

function deletePendingMigrations(
	pending: {
		name: string;
		path: string;
	}[],
) {
	return Effect.succeed(true).pipe(
		Effect.flatMap(() =>
			Effect.forEach(pending, (pendingMigration) =>
				Effect.succeed(true).pipe(
					Effect.map(() => {
						unlinkSync(pendingMigration.path);
						p.log.info(`${color.green("removed")} (${pendingMigration.path})`);
					}),
				),
			),
		),
	);
}

function cancelOperation() {
	return Effect.unit.pipe(
		Effect.tap(() => p.cancel("Operation cancelled.")),
		Effect.tap(() => Effect.fail(exit(1))),
	);
}
