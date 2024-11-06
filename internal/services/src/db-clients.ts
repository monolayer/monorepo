import { appEnvironmentCamelCasePlugin } from "@monorepo/state/app-environment.js";
import dotenv from "dotenv";
import { Context, Effect, Layer } from "effect";
import { gen } from "effect/Effect";
import { CamelCasePlugin, Kysely, PostgresDialect } from "kysely";
import pg from "pg";
import { connectionOptions } from "~services/db-clients/connection-options.js";

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
>() {
	static readonly LiveLayer = Layer.effect(
		DbClients,
		gen(function* () {
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

	static readonly TestLayer = (
		adminPool: pg.Pool,
		databaseName: string,
		camelCase = false,
		messages: string[] = [],
	) => {
		dotenv.config();
		const adminP = new pg.Pool({
			user: process.env.POSTGRES_USER,
			password: process.env.POSTGRES_PASSWORD,
			host: process.env.POSTGRES_HOST,
			port: Number(process.env.POSTGRES_PORT ?? 5432),
		});
		const pool = new pg.Pool({
			database: databaseName,
			user: process.env.POSTGRES_USER,
			password: process.env.POSTGRES_PASSWORD,
			host: process.env.POSTGRES_HOST,
			port: Number(process.env.POSTGRES_PORT ?? 5432),
		});
		return Layer.effect(
			DbClients,
			Effect.gen(function* () {
				yield* Effect.addFinalizer(() =>
					Effect.gen(function* () {
						yield* Effect.promise(() => pool.end());
						yield* Effect.promise(() => adminP.end());
					}),
				);
				return {
					pgPool: pool,
					pgAdminPool: adminP,
					databaseName,
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					kysely: new Kysely<any>({
						dialect: new PostgresDialect({
							pool: pool,
						}),
						plugins: camelCase ? [new CamelCasePlugin()] : [],
						log: (msg) => {
							messages.push(msg.query.sql);
						},
					}),
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					kyselyNoCamelCase: new Kysely<any>({
						dialect: new PostgresDialect({
							pool: pool,
						}),
					}),
				};
			}),
		);
	};
}
