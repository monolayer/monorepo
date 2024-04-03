import { Effect } from "effect";
import type { Config } from "~/config.js";

export function checkEnvironmentConfig(
	config: Config,
	environment: string,
): Effect.Effect<Config, Error, never> {
	const envConfig = config.environments[environment];
	if (envConfig === undefined) {
		return Effect.fail(
			new Error(
				`Configuration not found for environment '${environment}'. Please check your yount.config.ts file.`,
			),
		);
	} else {
		return Effect.succeed(config);
	}
}
