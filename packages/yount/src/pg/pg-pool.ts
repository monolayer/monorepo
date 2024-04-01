import pg from "pg";
import pgConnectionString from "pg-connection-string";
import color from "picocolors";
import { exit } from "process";
import { log } from "~/cli/utils/clack.js";
import { Config } from "~/config.js";

export function pgPoolAndConfig(config: Config, environment: string) {
	const environmentConfig = config.environments[environment];
	if (environmentConfig === undefined) {
		log.lineMessage(
			`${color.red(
				"error",
			)} No configuration found for environment: '${environment}'. Please check your yount.ts file.`,
		);
		exit(1);
	}

	return {
		pool: new pg.Pool(environmentConfig),
		adminPool: new pg.Pool({
			...environmentConfig,
			database: undefined,
		}),
		config:
			environmentConfig.connectionString !== undefined
				? pgConnectionString.parse(environmentConfig.connectionString)
				: environmentConfig,
	};
}

export function pgPool(config: Config, environment: string) {
	return pgPoolAndConfig(config, environment).pool;
}
