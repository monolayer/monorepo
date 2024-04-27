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
