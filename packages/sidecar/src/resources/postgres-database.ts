import { kebabCase, snakeCase } from "case-anything";
import { assertContainerizedResource } from "~sidecar/resources/containerized-resource.js";
import {
	type GenericResource,
	type ResourceBuilder,
	type ResourceClient,
} from "~sidecar/resources/interfaces.js";

/**
 * PostgreSQL resource.
 *
 * @example
 * ```ts
 * import { PostgreSQL } from "@monolayer/sidecar";
 * import pg from "pg";
 *
 * export const db = new PostgreSQL(
 *   "app-db",
 *   (connectionStringEnvVar) =>
 *     new pg.Pool({
 *       connectionString: process.env[connectionStringEnvVar],
 *     }),
 * );
 * ```
 *
 * @typeParam C - Client type
 */
export class PostgresDatabase<C>
	implements GenericResource, ResourceClient<C>, ResourceBuilder
{
	/**
	 * Docker image for container
	 *
	 * @defaultValue `postgres:16.5-alpine3.20`
	 */
	static containerImage: string = "postgres:16.5-alpine3.20";

	readonly id: string;

	constructor(
		/**
		 * Unique ID.
		 */
		id: string,
		/**
		 * Client constructor function. Executed once when accessing the {@link PostgresDatabase.client }
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
	 * export const db = new PostgreSQL(
	 *   "app-db",
	 *   // connectionStringEnvVar: SIDECAR_POSTGRESQL_APP_DB_URL
	 *   (connectionStringEnvVar) =>
	 *     new pg.Pool({
	 *       connectionString: process.env[connectionStringEnvVar],
	 *     }),
	 * );
	 */
	connectionStringEnvVar() {
		return snakeCase(`SIDECAR_POSTGRESQL_${this.id}_url`).toUpperCase();
	}

	/**
	 * Returns the build output for the resource.
	 *
	 * @hidden
	 */
	build() {
		return {
			kind: "postgresql",
			id: kebabCase(this.id),
			connectionStringEnvVar: this.connectionStringEnvVar(),
		};
	}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
assertContainerizedResource(PostgresDatabase<any>);

/**
 * Tests whether the connection string points to a local container.
 */
export function localUri(connectionString: string) {
	const localConnection = "postgresql://postgres:postgres@localhost:";
	return connectionString.startsWith(localConnection);
}
