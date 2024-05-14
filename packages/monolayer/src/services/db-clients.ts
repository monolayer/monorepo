import { Context, Effect, Layer } from "effect";
import {
	CamelCasePlugin,
	Kysely,
	PostgresAdapter,
	PostgresDialect,
	type DialectAdapter,
} from "kysely";
import type { QueryResultRow } from "pg";
import pg from "pg";
import pgConnectionString from "pg-connection-string";
import type { PgConfig } from "~/configuration.js";
import {
	appEnvironmentCamelCasePlugin,
	appEnvironmentPgConfig,
	appEnvironmentPgConfigDev,
} from "~/state/app-environment.js";

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
		Effect.gen(function* () {
			return {
				currentEnvironment: dbClientEnvironmentProperties(
					yield* appEnvironmentPgConfig,
					(yield* appEnvironmentCamelCasePlugin).enabled,
				),
				developmentEnvironment: dbClientEnvironmentProperties(
					yield* appEnvironmentPgConfigDev,
					(yield* appEnvironmentCamelCasePlugin).enabled,
				),
			};
		}),
	);
}

export class MonolayerPostgresAdapter extends PostgresAdapter {
	public static useTransaction: boolean = true;

	get supportsTransactionalDdl() {
		return MonolayerPostgresAdapter.useTransaction;
	}
}

export class MonolayerPostgresDialect extends PostgresDialect {
	createAdapter(): DialectAdapter {
		return new MonolayerPostgresAdapter();
	}
}

function dbClientEnvironmentProperties(pgConfig: PgConfig, camelCase: boolean) {
	const pg = poolAndConfig(pgConfig);
	return {
		databaseName: pg.config.database ?? "",
		pgPool: pg.pool,
		pgAdminPool: pg.adminPool,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		kysely: new Kysely<any>({
			dialect: new MonolayerPostgresDialect({
				pool: pg.pool,
			}),
			plugins: camelCase === true ? [new CamelCasePlugin()] : [],
		}),
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		kyselyNoCamelCase: new Kysely<any>({
			dialect: new MonolayerPostgresDialect({
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

export function devEnvirinmentDbClient<
	T extends keyof DbClientEnvironmentProperties,
>(key: T) {
	return DbClients.pipe(
		Effect.flatMap((dbClients) =>
			Effect.succeed(dbClients.developmentEnvironment[key]),
		),
	);
}
export function pgQuery<T extends QueryResultRow = Record<string, unknown>>(
	query: string,
) {
	return DbClients.pipe(
		Effect.flatMap((clients) =>
			Effect.promise(async () => {
				const result = await clients.currentEnvironment.pgPool.query<T>(query);
				return result.rows;
			}),
		),
	);
}

export function adminPgQuery<
	T extends QueryResultRow = Record<string, unknown>,
>(query: string) {
	return DbClients.pipe(
		Effect.flatMap((clients) =>
			Effect.promise(async () => {
				const result =
					await clients.currentEnvironment.pgAdminPool.query<T>(query);
				return result.rows;
			}),
		),
	);
}

export function adminDevPgQuery<
	T extends QueryResultRow = Record<string, unknown>,
>(query: string) {
	return DbClients.pipe(
		Effect.flatMap((clients) =>
			Effect.promise(async () => {
				const result =
					await clients.developmentEnvironment.pgAdminPool.query<T>(query);
				return result.rows;
			}),
		),
	);
}
