export const NO_DEPENDENCY: NoDependencies = Object.freeze({
	__noDependencies__: true,
});

export interface NoDependencies {
	readonly __noDependencies__: true;
}

export type RevisionDependency = NoDependencies | string;
