import { kebabCase, snakeCase } from "case-anything";
import type { ResourceContainer } from "~sidecar/container.js";
import { GenericResource } from "~sidecar/resources/generic-resource.js";
import { RedisContainer } from "~sidecar/resources/redis/redis-container.js";
import type { ResourceClient } from "~sidecar/resources/resource-client.js";
import type { ResourceBuild } from "~sidecar/resources/types.js";

/**
 * Redis resource.
 *
 * @example
 * ```ts
 * import { Redis } from "@monolayer/sidecar";
 * import { createClient } from "redis";
 *
 * const redis = new Redis("redis-cache", (resource) =>
 *   createClient({
 *     url: process.env[resource.connectionString],
 *   }).on("error", (err) => console.error("Redis Client Error", err)),
 * );
 * ```
 *
 * @typeParam C - Client type
 */
export class Redis<C>
	implements
		GenericResource,
		ResourceContainer,
		ResourceBuild,
		ResourceClient<C>
{
	readonly id: string;
	/**
	 * Container Docker image name
	 */
	readonly containerImageName: string = "redis/redis-stack";
	/**
	 * Container Docker image tag
	 *
	 * @defaultValue `latest`
	 */
	containerImageTag: string = "latest";

	constructor(
		/**
		 * Unique ID.
		 */
		id: string,
		/**
		 * Client constructor function. Executed once when accessing the {@link Redis.client }
		 */
		client: (connectionStringVar: string) => C,
	) {
		this.id = id;
		this.#clientConstructor = client;
	}

	#client?: C | never;
	#clientConstructor: (connectionStringVar: string) => C;

	/**
	 * Return the client by calling the client constructor function.
	 *
	 * The client is memoized.
	 */
	get client(): C {
		if (this.#client) {
			return this.#client;
		}
		this.#client = this.#clientConstructor(this.connectionStringEnvVar());
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

	container(
		/**
		 * Container name
		 */
		name: string,
	) {
		return new RedisContainer(this, name);
	}

	/**
	 * Returns the build output for the resource.
	 *
	 * @hidden
	 */
	build() {
		return {
			kind: "redis",
			id: kebabCase(this.id),
			connectionStringEnvVar: this.connectionStringEnvVar(),
		};
	}
}
