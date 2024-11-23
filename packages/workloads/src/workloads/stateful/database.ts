import { StatefulWorkloadWithClient } from "~workloads/workloads/stateful/stateful-workload.js";

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
		super(options.serverId ?? databaseName, options.client);
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

	/**
	 * @internal
	 */
	abstract connStringPrefix(): string;

	/**
	 * @internal
	 */
	get connStringComponents() {
		return [this.connStringPrefix(), this.id, this.databaseName, "database"];
	}
}

export interface DatabaseOptions<C> {
	/**
	 * Database server ID
	 * @default: `databaseName`
	 *
	 */
	serverId?: string;
	/**
	 * Client constructor function. Executed once when accessing the `client` property.
	 */
	client: (connectionStringVar: string) => C;
}
