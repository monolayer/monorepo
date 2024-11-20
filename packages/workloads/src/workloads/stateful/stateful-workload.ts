import { snakeCase } from "case-anything";
import { Workload } from "~workloads/workloads/workload.js";

/**
 * @internal
 * @group Abstract Classes
 */
export abstract class StatefulWorkload extends Workload {
	/**
	 * @hidden
	 */
	stateful!: true;
}

/**
 * @group Abstract Classes
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
		this.#client = this.#clientConstructor(this.connectionStringEnvVar);
		return this.#client;
	}

	/**
	 * @internal
	 */
	abstract get connStringComponents(): string[];

	/**
	 * Returns the unique environment variable name that should hold the connection string.
	 */
	get connectionStringEnvVar() {
		return snakeCase(
			["wl", ...this.connStringComponents, "url"].join("_"),
		).toUpperCase();
	}
}
