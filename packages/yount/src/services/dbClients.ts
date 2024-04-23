import { Context, Effect, Layer } from "effect";
import { CamelCasePlugin, Kysely, PostgresDialect } from "kysely";
import pg from "pg";
import pgConnectionString from "pg-connection-string";
import {
	DevEnvironment,
	Environment,
	type EnvironmentProperties,
} from "./environment.js";

export type DbClientProperties = {
	readonly currentEnvironment: DbClientEnvironmentProperties;
	readonly developmentEnvironment: DbClientEnvironmentProperties;
};

export type DbClientEnvironmentProperties = {
	readonly pgPool: pg.Pool;
	readonly pgAdminPool: pg.Pool;
	readonly databaseName: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	readonly kysely: Kysely<any>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	readonly kyselyNoCamelCase: Kysely<any>;
};

export class DbClients extends Context.Tag("DbClients")<
	DbClients,
	DbClientProperties
>() {}

export function dbClientsLayer() {
	return Layer.effect(
		DbClients,
		Effect.gen(function* (_) {
			return {
				currentEnvironment: dbClientEnvironmentProperties(
					yield* _(Environment),
				),
				developmentEnvironment: dbClientEnvironmentProperties(
					yield* _(DevEnvironment),
				),
			};
		}),
	);
}

function dbClientEnvironmentProperties(environment: EnvironmentProperties) {
	const pg = poolAndConfig(environment.configurationConfig);
	return {
		databaseName: pg.config.database ?? "",
		pgPool: pg.pool,
		pgAdminPool: pg.adminPool,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		kysely: new Kysely<any>({
			dialect: new PostgresDialect({
				pool: pg.pool,
			}),
			plugins:
				environment.configuration.camelCasePlugin?.enabled === true
					? [new CamelCasePlugin()]
					: [],
		}),
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		kyselyNoCamelCase: new Kysely<any>({
			dialect: new PostgresDialect({
				pool: pg.pool,
			}),
		}),
	};
}

function poolAndConfig(environmentConfig: pg.ClientConfig & pg.PoolConfig) {
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
