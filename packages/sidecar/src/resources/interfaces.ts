import type { SidecarContainer } from "~sidecar/container.js";

export interface GenericResource {
	/**
	 * Unique ID
	 */
	readonly id: string;
}

export interface ResourceContainer {
	/**
	 * Container Docker image name
	 */
	readonly containerImageName: string;
	/**
	 * Container Docker image tag
	 */
	containerImageTag: string;

	/**
	 * Returns the container.
	 */
	container: (name: string, imageTag?: string) => SidecarContainer;
}

export interface ContainerizedResource
	extends GenericResource,
		ResourceContainer {}

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
