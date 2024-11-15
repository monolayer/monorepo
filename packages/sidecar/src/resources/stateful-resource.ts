import { snakeCase } from "case-anything";
import type { SidecarContainer } from "~sidecar/container.js";

/**
 * @typeParam C - Client type
 */
export type StatefulResourceOptions<C> = {
	/**
	 * Unique ID.
	 */
	id: string;
	/**
	 * Client constructor function. Executed once when accessing the {@link StatefulResource.client }
	 */
	client: (connectionStringVar: string) => C;
};

export abstract class StatefulResource<C> {
	/**
	 * Unique ID
	 */
	id: string;

	/**
	 * Container Docker image name
	 */
	abstract readonly containerImageName: string;
	/**
	 * Container Docker image tag
	 */
	abstract containerImageTag: string;

	#options: StatefulResourceOptions<C>;
	#client?: C | never;

	constructor(options: StatefulResourceOptions<C>) {
		this.id = options.id;
		this.#options = options;
	}

	/**
	 * @hidden
	 */
	abstract build(): StatefulResourceBuildOutput;
	abstract container(name: string): SidecarContainer;

	/**
	 * Return the client by calling the client constructor function.
	 *
	 * The client is memoized.
	 */
	get client(): C {
		if (this.#client) {
			return this.#client;
		}
		this.#client = this.#options.client(this.connectionStringEnvVar());
		return this.#client;
	}

	/**
	 * Environment variable that should holds the resource connection string.
	 *
	 * Format: `SIDECAR_${resourceName}_${kebabCase(resourceId)}_URL`.toUpperCase()
	 * @example
	 *
	 * const cache = new Redis("app-cache", (resource) => {
	 *   // SIDECAR_REDIS_APP_CACHE_URL
	 *   const connStringName = resource.connectionStringEnvVar();
	 *   createClient({
	 *     url: process.env[connStringName],
	 *   }).on("error", (err) => console.error("Redis Client Error", err))
	 * });
	 */
	connectionStringEnvVar() {
		return snakeCase(
			`SIDECAR_${this.constructor.name}_${this.id}_url`,
		).toUpperCase();
	}
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
