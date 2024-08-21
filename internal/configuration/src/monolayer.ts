/**
 * @group Classes, Types, and Interfaces
 */
export interface MonolayerConfiguration {
	/**
	 * Relative path to the `db` folder.
	 */
	folder: string;
}

/**
 * Defines the monolayer configuration.
 *
 * @example
 * In the `monolayer.ts` file in the root of your project (where `package.json` is located), you can define the configuration like this:
 * ```ts
 * export default defineConfig({
 * 	folder: "app/db", // relative path to the `db` folder
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
	 * Relative path to the `db` folder.
	 *
	 * @readonly
	 */
	readonly folder: string;

	constructor(config: MonolayerConfiguration) {
		this.folder = config.folder;
	}
}
