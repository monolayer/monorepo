import { snakeCase } from "case-anything";
import { Workload } from "~workloads/workloads/workload.js";

/**
 * @group Abstract Classes
 */
export abstract class StatefulWorkload extends Workload {
	/**
	 * @hidden
	 * @internal
	 */
	stateful!: true;
}

/**
 * @group Abstract Classes
 * @typeParam C - Client type
 */
export abstract class StatefulWorkloadWithClient extends StatefulWorkload {
	constructor(
		/**
		 * Unique ID.
		 */
		id: string,
	) {
		super(id);
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
			["ml", ...this.connStringComponents, "url"].join("_"),
		).toUpperCase();
	}

	/**
	 * Reads the value fron environment variable name that should hold the connection string.
	 */
	get connectionString() {
		const value = process.env[this.connectionStringEnvVar];
		if (value === undefined) {
			throw new Error(
				`Expected environment variable with connection string ${this.connectionStringEnvVar}`,
			);
		}
		return value;
	}
}
