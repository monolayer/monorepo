import { Context, Effect, Layer } from "effect";
import { UnknownException } from "effect/Cause";
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
import { ActionError } from "~/cli/errors.js";
import type { PgConfig } from "~/configuration.js";
import {
	appEnvironmentCamelCasePlugin,
	appEnvironmentPgConfig,
} from "~/state/app-environment.js";

export type DbClientProperties = {
	readonly currentEnvironment: DbClientEnvironmentProperties;
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
	const config =
		environmentConfig.connectionString !== undefined
			? pgConnectionString.parse(environmentConfig.connectionString)
			: environmentConfig;

	return {
		pool: new pg.Pool(environmentConfig),
		adminPool: new pg.Pool({
			user: config.user,
			password: config.password,
			host: config.host ?? "",
			port: Number(config.port ?? 5432),
			database: undefined,
		}),
		config,
	};
}

export const dbClient = Effect.gen(function* () {
	const dbClients = yield* DbClients;
	return dbClients.currentEnvironment;
});

export const kyselyDb = Effect.gen(function* () {
	const dbClients = yield* DbClients;
	return dbClients.currentEnvironment.kysely;
});

export const kyselyNoCamelCaseDb = Effect.gen(function* () {
	const dbClients = yield* DbClients;
	return dbClients.currentEnvironment.kyselyNoCamelCase;
});

export function pgQuery<T extends QueryResultRow = Record<string, unknown>>(
	query: string,
) {
	return DbClients.pipe(
		Effect.flatMap((clients) =>
			Effect.tryPromise(async () => {
				const result = await clients.currentEnvironment.pgPool.query<T>(query);
				return result.rows;
			}),
		),
	);
}

export function adminPgQuery<
	T extends QueryResultRow = Record<string, unknown>,
>(query: string) {
	return Effect.gen(function* () {
		const pool = yield* pgAdminPool;
		return yield* Effect.tryPromise({
			try: async () => {
				return (await pool.query<T>(query)).rows;
			},
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			catch: (error: unknown) => {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const anyError = error as unknown as any;
				if (
					anyError.code !== undefined &&
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					anyError.severity !== undefined
				) {
					return new ActionError("QueryError", anyError.message);
				}
				return new UnknownException(error);
			},
		});
	});
}

const pgAdminPool = Effect.gen(function* () {
	const dbClients = yield* DbClients;
	return dbClients.currentEnvironment.pgAdminPool;
});

export const currentEnvironmentDatabaseName = Effect.gen(function* () {
	const dbClients = yield* DbClients;
	return dbClients.currentEnvironment.databaseName;
});

export function kyselyWithConnectionString(connection_string: string) {
	const pgPool = new pg.Pool({ connectionString: connection_string });
	const kysely = new Kysely({
		dialect: new MonolayerPostgresDialect({ pool: pgPool }),
	});
	return Effect.succeed(kysely);
}
