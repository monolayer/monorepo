import { snakeCase } from "case-anything";
import {
	type StatefulWorkload,
	type WorkloadClient,
} from "~sidecar/workloads/stateful/interfaces.js";

/**
 * Mailer workload.
 *
 * @example
 * ```ts
 * import { Mailer } from "@monolayer/sidecar";
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
export class Mailer<C> implements StatefulWorkload, WorkloadClient<C> {
	stateful!: true;
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
	 * Environment variable that should holds the workload connection string.
	 *
	 * Format: `WL_${workloadName}_${kebabCase(workloadId)}_URL`.toUpperCase()
	 * @example
	 *
	 * const mailer = new Mailer("transactional", (connectionStringEnvVar) =>
	 *  nodemailer.createTransport(
	 *     // connectionStringEnvVar: WL_MAILER_TRANSACTIONAL_URL
	 *     process.env[connectionStringEnvVar]
	 *   ),
	 * );
	 */
	connectionStringEnvVar() {
		return snakeCase(`WL_MAILER_${this.id}_url`).toUpperCase();
	}
}
