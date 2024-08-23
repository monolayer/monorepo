/**
 * @group Classes, Types, and Interfaces
 */
export interface MonolayerConfiguration {
	/**
	 * Relative path to a file exporting database definitions.
	 */
	databases: string;
}

/**
 * Defines the monolayer configuration.
 *
 * @example
 * In the `monolayer.config.ts` file in the root of your project (where `package.json` is located), you can define the configuration like this:
 * ```ts
 * export default defineConfig({
 * 	databases: "app/db/databases.ts",
 * });
 * ```
 *
 * @group Functions
 *
 */
export function defineConfig(config: MonolayerConfiguration) {
	return new MonolayerConfig(config);
}

/**
 * @group Classes, Types, and Interfaces
 */
export class MonolayerConfig {
	/**
	 * Relative path to a file exporting database definitions.
	 */
	readonly databases: string;

	constructor(config: MonolayerConfiguration) {
		this.databases = config.databases;
	}
}
