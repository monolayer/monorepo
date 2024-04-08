import { Context, Effect, Layer } from "effect";
import pg from "pg";
import pgConnectionString from "pg-connection-string";
import { DevEnvironment, Environment } from "./environment.js";

export class Pg extends Context.Tag("Pg")<
	Pg,
	{
		readonly pool: pg.Pool;
		readonly adminPool: pg.Pool;
		readonly config:
			| (pg.ClientConfig & pg.PoolConfig)
			| pgConnectionString.ConnectionOptions;
	}
>() {}

export class DevPg extends Context.Tag("Pg")<
	DevPg,
	{
		readonly pool: pg.Pool;
		readonly adminPool: pg.Pool;
		readonly config:
			| (pg.ClientConfig & pg.PoolConfig)
			| pgConnectionString.ConnectionOptions;
	}
>() {}

export function pgLayer() {
	return Layer.effect(
		Pg,
		Effect.gen(function* (_) {
			const environment = yield* _(Environment);
			return poolAndConfig(environment.connectionConfig);
		}),
	);
}

export function devPgLayer() {
	return Layer.effect(
		Pg,
		Effect.gen(function* (_) {
			const environment = yield* _(DevEnvironment);
			return poolAndConfig(environment.connectionConfig);
		}),
	);
}

function poolAndConfig(environmentConfig: pg.ClientConfig & pg.PoolConfig) {
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
	return poolAndConfig;
}
