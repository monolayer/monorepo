import { snakeCase } from "case-anything";
import dotenv from "dotenv";
import { MemcacheClient, type MemcacheClientOptions } from "memcache-client";
import { MemcachedContainer } from "~resources/key-value-stores/memcached/container.js";
import { readEnvVar } from "~resources/read-env.js";

export class MemcachedStore {
	/** ID of the {@link MemcachedStore}. */
	id: string;

	#client?: MemcacheClient;

	/**
	 * Container for the {@link MemcachedStore}.
	 */
	container: MemcachedContainer;

	/**
	 * @hideconstructor
	 */
	constructor(id: string, clientOptions?: MemcacheClientOptions) {
		this.id = id;
		this.container = new MemcachedContainer({
			resourceId: id,
			connectionStringEnvVarName: this.credentialsEnvVar,
		});
	}

	/**
	 * Returns a {@link https://www.npmjs.com/package/memcache-client | memcache-client } for the {@link MemcachedStore}.
	 */
	get client() {
		if (this.#client === undefined) {
			const envVar = this.credentialsEnvVar;
			let readEnv = {} as Record<string, string>;
			dotenv.config({ processEnv: readEnv });
			this.#client = new MemcacheClient({
				server: readEnvVar(envVar),
			});
		}
		return this.#client as MemcacheClient;
	}

	/**
	 * Returns the environment variable name that should contain the Memcached instance URL.
	 *
	 * The client will connect to the memcached instance with this environment variable.
	 *
	 * @remarks
	 *
	 * Each {@link MemcachedStore} has a unique environment variable name (as long unique IDs are used).
	 */
	get credentialsEnvVar() {
		return `MEMCACHED_${snakeCase(this.id).toUpperCase()}_URL`;
	}
}

export function defineMemcachedStore(id: string) {
	return new MemcachedStore(id);
}
