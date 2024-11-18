import { StatefulWorkloadWithClient } from "~sidecar/workloads/stateful/stateful-workload.js";

/**
 * Database workload.
 *
 * @typeParam C - Client type
 */
export abstract class Database<C> extends StatefulWorkloadWithClient<C> {
	readonly databaseName: string;

	constructor(
		/**
		 * Database name.
		 */
		databaseName: string,
		/**
		 * Database ID
		 */
		databaseId: string,
		/**
		 * Client constructor function. Executed once when accessing the `client` property.
		 */
		client: (connectionStringVar: string) => C,
	) {
		super(databaseId, client);
		this.databaseName = databaseName;
	}
}
