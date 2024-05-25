import { Context, Effect, Layer } from "effect";
import {
	FileMigrationProvider,
	Migrator as KyselyMigrator,
	NO_MIGRATIONS,
} from "kysely";
import fs from "node:fs/promises";
import path from "path";
import { ActionError } from "~/cli/cli-action.js";
import type { MonolayerMigration } from "~/migrations/migration.js";
import { appEnvironmentMigrationsFolder } from "~/state/app-environment.js";
import { DbClients } from "./db-clients.js";

export type MigratorAttributes = {
	readonly instance: KyselyMigrator;
	readonly folder: string;
};

export class Migrator extends Context.Tag("Migrator")<
	Migrator,
	MigratorAttributes
>() {}

export class MonolayerMigrator extends KyselyMigrator {
	declare migrateWithTransaction: boolean;
}

export function migratorLayer() {
	return Layer.effect(
		Migrator,
		Effect.gen(function* () {
			const schemaMigrationsFolder = yield* appEnvironmentMigrationsFolder;
			const dbClients = yield* DbClients;
			return {
				instance: new MonolayerMigrator({
					db: dbClients.currentEnvironment.kysely,
					provider: new FileMigrationProvider({
						fs,
						path,
						migrationFolder: schemaMigrationsFolder,
					}),
				}),
				folder: schemaMigrationsFolder,
			};
		}),
	);
}

export const getMigrations = Effect.gen(function* () {
	const migrator = yield* Migrator;
	return yield* Effect.tryPromise(() => migrator.instance.getMigrations());
});

export const pendingMigrations = Effect.gen(function* () {
	return (yield* getMigrations).filter((m) => m.executedAt === undefined);
});

export const lastExecutedMigration = Effect.gen(function* () {
	const all = yield* getMigrations;
	return all.find((m) => m.executedAt !== undefined)?.name ?? NO_MIGRATIONS;
});

export const migratorFolder = Effect.gen(function* () {
	const migrator = yield* Migrator;
	return migrator.folder;
});

export function readMigration(name: string) {
	return Effect.gen(function* () {
		const migrator = yield* Migrator;
		const migrationPath = path.join(migrator.folder, `${name}.ts`);
		const migration = yield* Effect.tryPromise(() => import(migrationPath));

		if (!isExtendedMigration(migration)) {
			return yield* Effect.fail(
				new ActionError(
					"Undefined migration",
					`No migration defined migration in ${migrationPath}`,
				),
			);
		}

		return migration;
	});
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isExtendedMigration(obj: any): obj is Required<MonolayerMigration> {
	return obj.migration !== undefined;
}
