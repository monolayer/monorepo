import { ActionError } from "@monorepo/base/errors.js";
import type { PgConfig } from "@monorepo/configuration/configuration.js";
import {
	appEnvironmentCamelCasePlugin,
	appEnvironmentPgConfig,
} from "@monorepo/state/app-environment.js";
import { Context, Effect, Layer } from "effect";
import { UnknownException } from "effect/Cause";
import { CamelCasePlugin, Kysely, PostgresDialect } from "kysely";
import type { QueryResultRow } from "pg";
import pg from "pg";
import pgConnectionString from "pg-connection-string";

export type DbClientProperties = {
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
			const props = dbClientEnvironmentProperties(
				yield* appEnvironmentPgConfig,
				(yield* appEnvironmentCamelCasePlugin).enabled,
			);
			yield* Effect.addFinalizer(() =>
				Effect.gen(function* () {
					yield* Effect.promise(() => props.pgPool.end());
					yield* Effect.promise(() => props.pgAdminPool.end());
				}),
			);
			return {
				pgPool: props.pgPool,
				pgAdminPool: props.pgAdminPool,
				databaseName: props.databaseName,
				kysely: props.kysely,
				kyselyNoCamelCase: props.kyselyNoCamelCase,
			};
		}),
	);
}

function dbClientEnvironmentProperties(pgConfig: PgConfig, camelCase: boolean) {
	const pg = poolAndConfig(pgConfig);
	return {
		databaseName: pg.config.database ?? "",
		pgPool: pg.pool,
		pgAdminPool: pg.adminPool,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		kysely: new Kysely<any>({
			dialect: new PostgresDialect({
				pool: pg.pool,
			}),
			plugins: camelCase === true ? [new CamelCasePlugin()] : [],
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
	const config =
		environmentConfig.connectionString !== undefined
			? pgConnectionString.parse(environmentConfig.connectionString)
			: environmentConfig;

	return {
		pool: new pg.Pool({
			...environmentConfig,
			...(environmentConfig.ssl !== undefined
				? { ssl: environmentConfig.ssl }
				: {}),
		}),
		adminPool: new pg.Pool({
			user: config.user,
			password: config.password,
			host: config.host ?? "",
			port: Number(config.port ?? 5432),
			database: undefined,
			...(environmentConfig.ssl !== undefined
				? { ssl: environmentConfig.ssl }
				: {}),
		}),
		config,
	};
}

export function pgQuery<T extends QueryResultRow = Record<string, unknown>>(
	query: string,
) {
	return DbClients.pipe(
		Effect.flatMap((clients) =>
			Effect.tryPromise(async () => {
				const result = await clients.pgPool.query<T>(query);
				return result.rows;
			}),
		),
	);
}

export function adminPgQuery<
	T extends QueryResultRow = Record<string, unknown>,
>(query: string) {
	return Effect.gen(function* () {
		const pool = (yield* DbClients).pgAdminPool;
		return yield* Effect.tryPromise({
			try: async () => {
				return (await pool.query<T>(query)).rows;
			},
			catch: (error: unknown) => {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const anyError = error as unknown as any;
				if (anyError.code !== undefined && anyError.severity !== undefined) {
					return new ActionError("QueryError", anyError.message);
				}
				return new UnknownException(error);
			},
		});
	});
}

export function kyselyWithConnectionString(connection_string: string) {
	const pgPool = new pg.Pool({ connectionString: connection_string });
	const kysely = new Kysely({
		dialect: new PostgresDialect({ pool: pgPool }),
	});
	return Effect.succeed(kysely);
}
