import { kebabCase } from "case-anything";
import { Effect } from "effect";
import type {
	Migration as KyselyMigration,
	MigrationInfo as KyselyMigrationInfo,
} from "kysely";
import { migrationNamePrompt } from "~/prompts/migration-name.js";
import { promptCancelError } from "../cli/cli-action.js";

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

export type MonolayerMigrationInfo = KyselyMigrationInfo & Migration;

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

export function migrationName() {
	return Effect.gen(function* () {
		const migrationName = yield* Effect.tryPromise(() => migrationNamePrompt());
		if (typeof migrationName !== "string") {
			return yield* promptCancelError;
		}
		return kebabCase(migrationName);
	});
}
