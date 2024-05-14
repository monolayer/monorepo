import { kebabCase } from "case-anything";
import { Effect } from "effect";
import { mkdirSync } from "fs";
import type {
	Migration as KyselyMigration,
	MigrationInfo as KyselyMigrationInfo,
} from "kysely";
import { migrationNamePrompt } from "~/prompts/migration-name.js";
import { promptCancelError } from "../cli/cli-action.js";
import {
	getMigrations,
	migratorFolder,
	readMigration,
} from "../services/migrator.js";

export const NO_DEPENDENCY: NoDependencies = Object.freeze({
	__noDependencies__: true,
});

export interface NoDependencies {
	readonly __noDependencies__: true;
}

export type MigrationDependency = NoDependencies | string;

export type Migration = {
	/**
	 * The name of the migration.
	 * @internal
	 */
	name?: string;
	/**
	 * Dependency of the migration.
	 * @internal
	 */
	dependsOn: MigrationDependency;
	/**
	 * Whether the migration was scaffolded.
	 * @internal
	 */
	scaffold: boolean;
	/**
	 * Whether the migration runs in a transaction.
	 * @internal
	 */
	transaction?: boolean;
};

export interface MonolayerMigrationInfo extends KyselyMigrationInfo {
	dependsOn: MigrationDependency;
	scaffold: boolean;
	transaction: boolean;
}

export interface MonolayerMigration extends KyselyMigration {
	migration: Migration;
}

export function migrationInfoToMigration(
	migrationInfo: readonly KyselyMigrationInfo[],
) {
	return migrationInfo.map((info) => {
		return {
			...(info.migration as MonolayerMigration).migration,
			name: info.name,
			transaction: false,
		} satisfies Migration;
	});
}

export class MigrationError extends TypeError {
	constructor(migration: string) {
		super(`undefined migration in ${migration}`);
	}
}

export function migrationName() {
	return Effect.gen(function* () {
		const migrationName = yield* Effect.tryPromise(() => migrationNamePrompt());
		if (typeof migrationName !== "string") {
			return yield* promptCancelError;
		}
		return kebabCase(migrationName);
	});
}
export function migrationDependency() {
	return Effect.gen(function* () {
		const migrations = yield* allMigrations;
		return migrations.map((m) => m.name).slice(-1)[0] ?? "NO_DEPENDENCY";
	});
}

export const allMigrations = Effect.gen(function* () {
	const folder = yield* migratorFolder;
	mkdirSync(folder, { recursive: true });

	const migrationInfo = yield* getMigrations;

	return yield* kyselyMigrationInfoToMonolayerMigrationInfo(migrationInfo);
});

export function kyselyMigrationInfoToMonolayerMigrationInfo(
	migrationInfo: readonly KyselyMigrationInfo[],
) {
	return Effect.gen(function* () {
		const monolayerMigrationInfo: MonolayerMigrationInfo[] = [];
		for (const info of migrationInfo) {
			const migration = yield* readMigration(info.name);
			monolayerMigrationInfo.push({
				...info,
				transaction: migration.migration.transaction ?? false,
				scaffold: migration.migration.scaffold,
				dependsOn: migration.migration.dependsOn,
			});
		}

		return monolayerMigrationInfo;
	});
}
