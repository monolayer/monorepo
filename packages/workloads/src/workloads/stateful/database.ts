import { StatefulWorkloadWithClient } from "~sidecar/workloads/stateful/stateful-workload.js";

/**
 * Database workload.
 *
 * @group Abstract Classes
 * @typeParam C - Client type
 */
export abstract class Database<C> extends StatefulWorkloadWithClient<C> {
	/**
	 * Database name.
	 */
	readonly databaseName: string;

	constructor(
		/**
		 * Database name.
		 */
		databaseName: string,

		/**
		 * Options
		 */
		options: DatabaseOptions<C>,
	) {
		super(options.databaseId, options.client);
		this.databaseName = databaseName;
	}

	/**
	 * Database ID
	 *
	 * **Note:**
	 * Alias of `ìd`.
	 */
	get databaseId() {
		return this.id;
	}
}

export interface DatabaseOptions<C> {
	/**
	 * Database ID
	 * @default: `databaseName`
	 *
	 */
	databaseId: string;
	/**
	 * Client constructor function. Executed once when accessing the `client` property.
	 */
	client: (connectionStringVar: string) => C;
}
