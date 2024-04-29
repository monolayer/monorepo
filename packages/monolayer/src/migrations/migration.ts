import { kebabCase } from "case-anything";
import { Effect } from "effect";
import { mkdirSync } from "fs";
import type { Migration as KyselyMigration, MigrationInfo } from "kysely";
import { migrationNamePrompt } from "~/prompts/migration-name.js";
import { PromptCancelError } from "../cli/cli-action.js";
import { Migrator, type MigratorAttributes } from "../services/migrator.js";

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
};

export interface ExtendedMigration extends KyselyMigration {
	migration: Migration;
}

export function migrationInfoToMigration(
	migrationInfo: readonly MigrationInfo[],
) {
	return migrationInfo.map((info) => {
		return {
			...(info.migration as ExtendedMigration).migration,
			name: info.name,
		} satisfies Migration;
	});
}

export class MigrationError extends TypeError {
	constructor(migration: string) {
		super(`undefined migration in ${migration}`);
	}
}

export function migrationName() {
	return Effect.gen(function* (_) {
		const migrationName = yield* _(
			Effect.tryPromise(() => migrationNamePrompt()),
		);
		if (typeof migrationName !== "string") {
			return yield* _(Effect.fail(new PromptCancelError()));
		}
		return kebabCase(migrationName);
	});
}
export function migrationDependency() {
	return Effect.gen(function* (_) {
		const migrations = yield* _(allMigrations());
		return migrations.map((m) => m.name).slice(-1)[0] ?? "NO_DEPENDENCY";
	});
}

export function allMigrations() {
	return Migrator.pipe(
		Effect.tap(createMigrationFolder),
		Effect.flatMap(getMigrations),
	);
}

function createMigrationFolder(migrator: MigratorAttributes) {
	mkdirSync(migrator.folder, { recursive: true });
}

function getMigrations(migrator: MigratorAttributes) {
	return Effect.tryPromise(() => migrator.instance.getMigrations());
}
