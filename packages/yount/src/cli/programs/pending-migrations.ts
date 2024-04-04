import * as p from "@clack/prompts";
import { confirm } from "@clack/prompts";
import { Effect } from "effect";
import { unlinkSync } from "fs";
import { readdir } from "fs/promises";
import type { MigrationInfo } from "kysely";
import path from "path";
import color from "picocolors";
import { cwd, exit } from "process";
import type { Config } from "~/config.js";
import type { PoolAndConfig } from "~/pg/pg-pool.js";
import { kyselyMigrator } from "./kysely.js";
import { migrationFolder } from "./migration-folder.js";

export function migrationFiles(
	folder: string,
	migrationsFolderName = "migrations",
) {
	return Effect.tryPromise(async () => {
		const migrationsFolder = path.join(cwd(), folder, migrationsFolderName);
		return await readdir(migrationsFolder);
	});
}

export function handlePendingMigrations(poolAndConfig: {
	pg: PoolAndConfig;
	config: Config;
}) {
	return Effect.all([
		migrationFolder(poolAndConfig.config),
		allMigrations(poolAndConfig),
		migrationFiles(poolAndConfig.config.folder),
	]).pipe(
		Effect.flatMap(([migrationFolder, migrationInfo, migrationFiles]) => {
			return filterPendingMigrations(
				migrationFolder,
				migrationInfo,
				migrationFiles,
			);
		}),
		Effect.tap((pending) =>
			Effect.if(pending.length > 0, {
				onTrue: deletePendingAndContinue(pending),
				onFalse: Effect.unit,
			}),
		),
	);
}

function filterPendingMigrations(
	migrationFolder: string,
	allMigrations: readonly MigrationInfo[],
	migrationFiles: string[],
) {
	const filtered = allMigrations
		.filter((m) => m.executedAt === undefined)
		.map((m) => {
			const migrationFile = migrationFiles.find((f) => f.startsWith(m.name));
			return {
				name: m.name,
				path:
					migrationFile !== undefined
						? path.join(migrationFolder, migrationFile)
						: "PATH NOT FOUND",
			};
		});
	return Effect.succeed(filtered);
}

function allMigrations(poolAndConfig: { pg: PoolAndConfig; config: Config }) {
	return Effect.gen(function* (_) {
		const migrator = yield* _(kyselyMigrator(poolAndConfig));
		const allMigrations = yield* _(
			Effect.promise(async () => {
				return await migrator.getMigrations();
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
