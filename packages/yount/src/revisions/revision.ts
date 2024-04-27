import type { Migration, MigrationInfo } from "kysely";

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
