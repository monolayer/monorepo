import { snakeCase } from "case-anything";
import { assertContainerizedResource } from "~sidecar/resources/containerized-resource.js";
import {
	type GenericResource,
	type ResourceClient,
} from "~sidecar/resources/interfaces.js";

/**
 * Redis resource.
 *
 * @example
 * ```ts
 * import { Redis } from "@monolayer/sidecar";
 * import nodemailer from 'nodemailer';
 * const mailer = new Mailer("transactional", (connectionStringEnvVar) =>
 *   nodemailer.createTransport(
 *     process.env[connectionStringEnvVar]
 *   ),
 * );
 * ```
 *
 * @typeParam C - Client type
 */
export class Mailer<C> implements GenericResource, ResourceClient<C> {
	/**
	 * Docker image for container
	 *
	 * @defaultValue `redis/redis-stack:latest`
	 */
	static containerImage: string = "axllent/mailpit:v1.21.3";

	readonly id: string;

	constructor(
		/**
		 * Unique ID.
		 */
		id: string,
		/**
		 * Client constructor function. Executed once when accessing the {@link Mailer.client }
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
	 * const mailer = new Mailer("transactional", (connectionStringEnvVar) =>
	 *  nodemailer.createTransport(
	 *     // connectionStringEnvVar: SIDECAR_MAILER_TRANSACTIONAL_URL
	 *     process.env[connectionStringEnvVar]
	 *   ),
	 * );
	 */
	connectionStringEnvVar() {
		return snakeCase(`SIDECAR_MAILER_${this.id}_url`).toUpperCase();
	}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
assertContainerizedResource(Mailer<any>);
