import { kebabCase } from "case-anything";
import type { ResourceContainer } from "~sidecar/container.js";
import { RedisContainer } from "~sidecar/resources/redis/redis-container.js";
import { Resource, type ResourceBuild } from "~sidecar/resources/resource.js";

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
	extends Resource<C>
	implements ResourceContainer, ResourceBuild
{
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
		super({
			id: id,
			client: client,
		});
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
