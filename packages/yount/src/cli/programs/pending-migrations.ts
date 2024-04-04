import * as p from "@clack/prompts";
import { confirm } from "@clack/prompts";
import { Effect, pipe } from "effect";
import { unlinkSync } from "fs";
import { readdir } from "fs/promises";
import path from "path";
import color from "picocolors";
import { exit } from "process";
import { Environment } from "../services/environment.js";
import { Migrator } from "../services/migrator.js";

export function migrationFiles(folder: string) {
	return Effect.tryPromise(async () => {
		return await readdir(folder);
	});
}

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

function localPendingMigrations() {
	return Effect.gen(function* (_) {
		const environment = yield* _(Environment);
		const migrationFolder = environment.config.migrationFolder;
		const localMigrationFiles = yield* _(migrationFiles(migrationFolder));
		const migrations = yield* _(allMigrations());
		const filtered = migrations
			.filter((m) => m.executedAt === undefined)
			.map((m) => {
				const migrationFile = localMigrationFiles.find((f) =>
					f.startsWith(m.name),
				);
				return {
					name: m.name,
					path:
						migrationFile !== undefined
							? path.join(migrationFolder, migrationFile)
							: "PATH NOT FOUND",
				};
			});
		return filtered;
	});
}

function allMigrations() {
	return Effect.gen(function* (_) {
		const migrator = yield* _(Migrator);
		const allMigrations = yield* _(
			Effect.promise(async () => {
				return await migrator.instance.getMigrations();
			}),
		);
		return allMigrations;
	});
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
