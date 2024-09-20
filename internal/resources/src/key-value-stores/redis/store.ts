import { snakeCase } from "case-anything";
import dotenv from "dotenv";
import {
	createClient,
	RedisClientType,
	type RedisFunctions,
	type RedisModules,
	type RedisScripts,
} from "redis"; // Adjust based on your Redis library version and imports
import { RedisContainer } from "~resources/key-value-stores/redis/container.js";
import { readEnvVar } from "~resources/read-env.js";

export class RedisStore {
	id: string;

	#client?: RedisClientType<RedisModules, RedisFunctions, RedisScripts>;

	container: RedisContainer;

	constructor(id: string) {
		this.id = id;
		this.container = new RedisContainer({
			resourceId: this.id,
			imageTag: "latest",
			connectionStringEnvVarName: this.credentialsEnvVar,
		});
	}

	/**
	 * Returns the Redis client for the RedisStore
	 */
	get client() {
		if (this.#client === undefined) {
			const envVar = this.credentialsEnvVar;
			let readEnv = {} as Record<string, string>;
			dotenv.config({ processEnv: readEnv });
			this.#client = createClient({
				url: readEnvVar(envVar),
			}).on("error", (err) => console.error("Redis Client Error", err));
			this.#client.connect();
		}
		return this.#client;
	}

	/**
	 * Returns the environment variable name that should contain the Memcached instance URL.
	 */
	get credentialsEnvVar() {
		return `REDIS_${snakeCase(this.id).toUpperCase()}_URL`;
	}
}

export function defineRedisStore(id: string) {
	return new RedisStore(id);
}
