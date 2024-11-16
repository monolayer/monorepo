export interface GenericResource {
	/**
	 * Unique ID
	 */
	readonly id: string;
}

export interface ResourceContainer {
	/**
	 * Docker image for container
	 */
	containerImage: string;
}

export interface ResourceBuildOutput {
	/**
	 * Resource type
	 */
	kind: string;
	/**
	 * Resource ID
	 */
	id: string;
	/**
	 * Environment variable name for the connection string;
	 */
	connectionStringEnvVar: string;
}

export interface ResourceBuilder {
	/**
	 * Returns a {@link ResourceBuildOutput}
	 */
	build: () => ResourceBuildOutput;
}

export interface ResourceClient<C> {
	client: C;
}

export interface SerializableStatic {
	fromObject: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function staticImplements<T>(ctor: T) {}
