import * as p from "@clack/prompts";
import { confirm } from "@clack/prompts";
import { Effect } from "effect";
import { unlinkSync } from "fs";
import type { MigrationInfo } from "kysely";
import path from "path";
import color from "picocolors";
import { cwd } from "process";
import { schemaMigrationsFolder } from "~/services/environment.js";
import { cancelOperation } from "../cli/cancel-operation.js";
import { allMigrations } from "./migration.js";

export function pendingMigrations() {
	return localPendingSchemaMigrations().pipe(
		Effect.tap((pendingMigrations) =>
			Effect.if(pendingMigrations.length > 0, {
				onTrue: () =>
					Effect.forEach(pendingMigrations, logPendingMigrationNames),
				onFalse: () => logNoPendingMigrations(),
			}),
		),
	);
}

function logNoPendingMigrations() {
	return Effect.void.pipe(
		Effect.tap(() => p.log.message("No pending migrations.")),
	);
}

function logPendingMigrationNames(migration: { name: string; path: string }) {
	p.log.message(
		`${color.yellow("pending")} ${path.basename(migration.path, ".ts")}`,
	);
	return Effect.void;
}

export function handlePendingSchemaMigrations() {
	return localPendingSchemaMigrations().pipe(
		Effect.flatMap((pendingMigrations) =>
			Effect.if(pendingMigrations.length > 0, {
				onTrue: () =>
					logPendingMigrations(pendingMigrations).pipe(
						Effect.flatMap(() =>
							askConfirmationDelete().pipe(
								Effect.flatMap((shouldContinue) =>
									Effect.if(shouldContinue === true, {
										onTrue: () => deletePendingMigrations(pendingMigrations),
										onFalse: () => cancelOperation(),
									}),
								),
							),
						),
					),
				onFalse: () => Effect.succeed(true),
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
					p.log.warn(
						`${color.yellow("pending")} ${path.relative(cwd(), pendingMigration.path)}`,
					),
				),
			),
		),
	);
}

function askConfirmationDelete() {
	return Effect.tryPromise(() =>
		confirm({
			initialValue: false,
			message: `You have pending schema migrations to apply and ${color.bold(
				"we need to delete them to continue",
			)}. Do you want to proceed?`,
		}),
	);
}

interface PendingMigration {
	name: string;
	path: string;
}

export function deletePendingMigrations(pendingMigrations: PendingMigration[]) {
	return Effect.forEach(pendingMigrations, deletePendingMigration).pipe(
		Effect.map(() => true),
	);
}

function deletePendingMigration(migration: PendingMigration) {
	return Effect.succeed(unlinkSync(migration.path));
}

export function localPendingSchemaMigrations() {
	return Effect.gen(function* (_) {
		const folder = yield* _(schemaMigrationsFolder());

		return (yield* _(allMigrations()))
			.filter(byNotExecuted)
			.map((m) => migrationNameAndPath(m, folder));
	});
}

function byNotExecuted(info: MigrationInfo) {
	return info.executedAt === undefined;
}

function migrationNameAndPath(info: MigrationInfo, folder: string) {
	return {
		name: info.name,
		path: path.join(folder, `${info.name}.ts`),
	};
}
