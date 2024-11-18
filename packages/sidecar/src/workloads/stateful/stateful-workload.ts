import { snakeCase } from "case-anything";
import type { WorkloadContainerOptions } from "~sidecar/containers/container.js";

/**
 * @internal
 */
export abstract class StatefulWorkload {
	/**
	 * @hidden
	 */
	stateful!: true;
	/**
	 * Unique ID.
	 */
	readonly id: string;

	constructor(
		/**
		 * Unique ID.
		 */
		id: string,
	) {
		this.id = id;
	}

	/**
	 * @internal
	 */
	_containerOptions?:
		| {
				options: Partial<WorkloadContainerOptions>;
		  }
		| undefined;
	public containerOptions({ imageName }: { imageName: string }) {
		this._containerOptions = {
			options: { containerImage: imageName },
		};
		return this;
	}
}

/**
 * @internal
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

	abstract get connStringComponents(): string[];

	/**
	 * Environment variable that should hold the workload connection string.
	 */
	connectionStringEnvVar() {
		return snakeCase(
			["wl", ...this.connStringComponents, "url"].join("_"),
		).toUpperCase();
	}
}
