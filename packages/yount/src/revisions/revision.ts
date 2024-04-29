import { kebabCase } from "case-anything";
import { Effect } from "effect";
import { mkdirSync } from "fs";
import type { Migration, MigrationInfo } from "kysely";
import { revisionNamePrompt } from "~/prompts/revision-name.js";
import { PromptCancelError } from "../programs/cli-action.js";
import { Migrator, type MigratorAttributes } from "../services/migrator.js";

export const NO_DEPENDENCY: NoDependencies = Object.freeze({
	__noDependencies__: true,
});

export interface NoDependencies {
	readonly __noDependencies__: true;
}

export type RevisionDependency = NoDependencies | string;

export type Revision = {
	/**
	 * The name of the revision.
	 * @internal
	 */
	name?: string;
	/**
	 * Dependency of the revision.
	 * @internal
	 */
	dependsOn: RevisionDependency;
	/**
	 * Whether the revision was scaffolded.
	 * @internal
	 */
	scaffold: boolean;
};

export interface RevisionMigration extends Migration {
	revision: Revision;
}

export function migrationInfoToRevisions(
	migrationInfo: readonly MigrationInfo[],
) {
	return migrationInfo.map((info) => {
		return {
			...(info.migration as RevisionMigration).revision,
			name: info.name,
		} satisfies Revision;
	});
}

export class RevisionError extends TypeError {
	constructor(revision: string) {
		super(`undefined revision in ${revision}`);
	}
}

export function revisionName() {
	return Effect.gen(function* (_) {
		const revisionName = yield* _(
			Effect.tryPromise(() => revisionNamePrompt()),
		);
		if (typeof revisionName !== "string") {
			return yield* _(Effect.fail(new PromptCancelError()));
		}
		return kebabCase(revisionName);
	});
}
export function revisionDependency() {
	return Effect.gen(function* (_) {
		const revisions = yield* _(allRevisions());
		return revisions.map((m) => m.name).slice(-1)[0] ?? "NO_DEPENDENCY";
	});
}

export function allRevisions() {
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
