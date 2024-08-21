import { ActionError } from "@monorepo/cli/errors.js";
import {
	appEnvironment,
	appEnvironmentCamelCasePlugin,
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

const CONNECTION_STRING_REGEX =
	/^(postgresql:\/\/(?:[^@]*@)?[^/]*)(?:\/[^?]*)(.*)$/;

export const connectionOptions = Effect.gen(function* () {
	const connectionString = (yield* appEnvironment).currentDatabase
		.connectionString;
	return {
		app: connectionString,
		admin: connectionString.replace(CONNECTION_STRING_REGEX, "$1$2"),
		databaseName: pgConnectionString.parse(connectionString).database ?? "",
	};
});

export function dbClientsLayer() {
	return Layer.effect(
		DbClients,
		Effect.gen(function* () {
			const connectionOpts = yield* connectionOptions;
			const pgPool = new pg.Pool({ connectionString: connectionOpts.app });
			const pgAdminPool = new pg.Pool({
				connectionString: connectionOpts.admin,
			});
			yield* Effect.addFinalizer(() =>
				Effect.gen(function* () {
					yield* Effect.promise(() => pgPool.end());
					yield* Effect.promise(() => pgAdminPool.end());
				}),
			);
			return {
				pgPool: pgPool,
				pgAdminPool: pgAdminPool,
				databaseName: connectionOpts.databaseName,
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				kysely: new Kysely<any>({
					dialect: new PostgresDialect({
						pool: pgPool,
					}),
					plugins:
						(yield* appEnvironmentCamelCasePlugin) === true
							? [new CamelCasePlugin()]
							: [],
				}),
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				kyselyNoCamelCase: new Kysely<any>({
					dialect: new PostgresDialect({
						pool: pgPool,
					}),
				}),
			};
		}),
	);
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
