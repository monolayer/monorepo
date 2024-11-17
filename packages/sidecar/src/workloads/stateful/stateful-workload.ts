import { snakeCase } from "case-anything";

export abstract class StatefulWorkload {
	stateful!: true;
	readonly id: string;

	constructor(
		/**
		 * Unique ID.
		 */
		id: string,
	) {
		this.id = id;
	}
}

/**
 * @typeParam C - Client type
 */
export abstract class StatefulWorkloadWithClient<C> extends StatefulWorkload {
	readonly connStringComponents: (keyof this)[] = ["id"];

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
	 * Environment variable that should hold the workload connection string.
	 */
	connectionStringEnvVar() {
		const components = this.connStringComponents.map((c) => this[c]).join("_");
		return snakeCase(
			`WL_${this.constructor.name}_${components}_url`,
		).toUpperCase();
	}
}
