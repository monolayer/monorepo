import dotenv from "dotenv";
import { Effect, Layer } from "effect";
import { CamelCasePlugin, Kysely, PostgresDialect } from "kysely";
import pg from "pg";
import { env } from "process";
import type { Configuration } from "~/configuration.js";
import { phasedMigratorLayer } from "~/migrations/phased-migrator.js";
import { DbClients, dbClientsLayer } from "~/services/db-clients.js";
import { globalPool } from "../setup.js";
dotenv.config();

function pgPool(database?: string) {
	return new pg.Pool({
		database,
		user: env.POSTGRES_USER,
		password: env.POSTGRES_PASSWORD,
		host: env.POSTGRES_HOST,
		port: Number(env.POSTGRES_ONE_PORT ?? 5432),
	});
}

export function mockedDbClientsLayer(
	databaseName: string,
	useCamelCase = { enabled: false },
) {
	const pool = pgPool(databaseName);
	return Layer.effect(
		DbClients,
		// eslint-disable-next-line require-yield
		Effect.gen(function* () {
			const adminPool = globalPool();
			const currentEnvironment = {
				databaseName: databaseName,
				pgPool: pool,
				pgAdminPool: adminPool,
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				kysely: new Kysely<any>({
					dialect: new PostgresDialect({
						pool: pool,
					}),
					plugins: useCamelCase.enabled ? [new CamelCasePlugin()] : [],
				}),
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				kyselyNoCamelCase: new Kysely<any>({
					dialect: new PostgresDialect({
						pool: pool,
					}),
				}),
			};
			return {
				currentEnvironment,
				developmentEnvironment: currentEnvironment,
			};
		}),
	);
}

function mockedMigratorLayer(
	databaseName: string,
	migrationFolder: string,
	useCamelCase = { enabled: false },
) {
	const pool = pgPool(databaseName);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const db = new Kysely<any>({
		dialect: new PostgresDialect({
			pool: pool,
		}),
		plugins: useCamelCase.enabled ? [new CamelCasePlugin()] : [],
	});
	return phasedMigratorLayer({ client: db, migrationFolder });
}

export type ConnectionLessConfiguration = Omit<Configuration, "connections">;

export function newLayers(
	databaseName: string,
	migrationFolder: string,
	connector: ConnectionLessConfiguration,
) {
	return mockedMigratorLayer(
		databaseName,
		migrationFolder,
		connector.camelCasePlugin,
	).pipe(
		Layer.provideMerge(
			mockedDbClientsLayer(databaseName, connector.camelCasePlugin),
		),
	);
}

export const layers = phasedMigratorLayer().pipe(
	Layer.provideMerge(dbClientsLayer()),
);
