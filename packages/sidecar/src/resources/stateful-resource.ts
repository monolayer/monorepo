import type { SidecarContainer } from "~sidecar/container.js";

/**
 * @typeParam C - Client type
 */
export type StatefulResourceOptions = {
	/**
	 * Unique ID.
	 */
	id: string;
};

export abstract class StatefulResource {
	/**
	 * Unique ID
	 */
	readonly id: string;

	/**
	 * Container Docker image name
	 */
	abstract readonly containerImageName: string;
	/**
	 * Container Docker image tag
	 */
	abstract containerImageTag: string;

	constructor(options: StatefulResourceOptions) {
		this.id = options.id;
	}

	abstract container(name: string): SidecarContainer;
}

export interface StatefulResourceBuildOutput {
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

export interface StatefulResourceBuild {
	/**
	 * Returns a {@link StatefulResourceBuildOutput}
	 */
	build: () => StatefulResourceBuildOutput;
}
