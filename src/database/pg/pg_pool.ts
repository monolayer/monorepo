import pg from "pg";
import parse from "pg-connection-string";
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
			)} No configuration found for environment: '${environment}'. Please check your kinetic.ts file.`,
		);
		exit(1);
	}
	const poolConfig =
		environmentConfig.connectionString === undefined
			? environmentConfig
			: parse.parse(environmentConfig.connectionString);

	return {
		pool: new pg.Pool({
			host: poolConfig.host || "",
			port: poolConfig.port ? parseInt(poolConfig.port.toString()) : 5432,
			user: poolConfig.user || "",
			password: poolConfig.password || "",
		}),
		config: poolConfig,
	};
}

export function pgPool(config: Config, environment: string) {
	return pgPoolAndConfig(config, environment).pool;
}
