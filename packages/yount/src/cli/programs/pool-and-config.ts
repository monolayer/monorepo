import { Effect } from "effect";
import pg from "pg";
import pgConnectionString from "pg-connection-string";

export function poolAndConfig(
	environmentConfig: pg.ClientConfig & pg.PoolConfig,
): Effect.Effect<
	{
		pool: pg.Pool;
		adminPool: pg.Pool;
		config:
			| (pg.ClientConfig & pg.PoolConfig)
			| pgConnectionString.ConnectionOptions;
	},
	string,
	never
> {
	const poolAndConfig = {
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
	return Effect.succeed(poolAndConfig);
}
