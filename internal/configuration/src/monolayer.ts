/**
 * @group Classes, Types, and Interfaces
 */
export interface MonolayerConfiguration {
	/**
	 * Entry points (files) for monolayer.
	 */
	entryPoints: {
		/**
		 * Relative path to the `databases.ts` file.
		 */
		databases: string;
		/**
		 * Relative path to the `seed.ts` file.
		 */
		seed: string;
	};
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
	 * Entry points (files) for monolayer.
	 */
	readonly entryPoints: {
		/**
		 * Relative path to the `databases.ts` file.
		 */
		readonly databases: string;
		/**
		 * Relative path to the `seed.ts` file.
		 */
		readonly seed: string;
	};

	constructor(config: MonolayerConfiguration) {
		this.entryPoints = config.entryPoints;
	}
}
