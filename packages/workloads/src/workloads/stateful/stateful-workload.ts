import { snakeCase } from "case-anything";
import { Workload } from "~sidecar/workloads/workload.js";

/**
 * @internal
 */
export abstract class StatefulWorkload extends Workload {
	/**
	 * @hidden
	 */
	stateful!: true;
}

/**
 * @typeParam C - Client type
 */
export abstract class StatefulWorkloadWithClient<C> extends StatefulWorkload {
	constructor(
		/**
		 * Unique ID.
		 */
		id: string,
		/**
		 * Client constructor function. Executed once when accessing the `client` property.
		 */
		client: (connectionStringVar: string) => C,
	) {
		super(id);
		this.#clientConstructor = client;
	}

	#client?: C | never;
	#clientConstructor: (connectionStringVar: string) => C;

	/**
	 * Returns the client by calling the client constructor function.
	 *
	 * Lazy-loaded and memoized.
	 */
	get client(): C {
		if (this.#client) {
			return this.#client;
		}
		this.#client = this.#clientConstructor(this.connectionStringEnvVar());
		return this.#client;
	}

	/**
	 * @internal
	 */
	abstract get connStringComponents(): string[];

	/**
	 * Returns the unique environment variable name that should hold the connection string.
	 */
	connectionStringEnvVar() {
		return snakeCase(
			["wl", ...this.connStringComponents, "url"].join("_"),
		).toUpperCase();
	}
}
