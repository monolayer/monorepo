import type { PgDatabase } from "@monorepo/pg/database.js";
import { phasedMigratorLayer } from "@monorepo/programs/phased-migrator.js";
import { DbClients } from "@monorepo/services/db-clients.js";
import dotenv from "dotenv";
import { Effect, Layer } from "effect";
import { CamelCasePlugin, Kysely, PostgresDialect } from "kysely";
import pg from "pg";
import { env } from "process";
import { globalPool } from "../setup.js";
dotenv.config();

function pgPool(database?: string) {
	return new pg.Pool({
		database,
		user: env.POSTGRES_USER,
		password: env.POSTGRES_PASSWORD,
		host: env.POSTGRES_HOST,
		port: Number(env.POSTGRES_PORT ?? 5432),
	});
}

export function mockedDbClientsLayer(databaseName: string, camelCase = false) {
	const pool = pgPool(databaseName);
	return Layer.effect(
		DbClients,
		// eslint-disable-next-line require-yield
		Effect.gen(function* () {
			const adminPool = globalPool();
			return {
				pgPool: pool,
				pgAdminPool: adminPool,
				databaseName,
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				kysely: new Kysely<any>({
					dialect: new PostgresDialect({
						pool: pool,
					}),
					plugins: camelCase ? [new CamelCasePlugin()] : [],
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
}

function mockedMigratorLayer(
	databaseName: string,
	migrationFolder: string,
	camelCase = false,
) {
	const pool = pgPool(databaseName);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const db = new Kysely<any>({
		dialect: new PostgresDialect({
			pool: pool,
		}),
		plugins: camelCase ? [new CamelCasePlugin()] : [],
	});
	return phasedMigratorLayer({ client: db, migrationFolder });
}

export function testLayers(
	databaseName: string,
	migrationFolder: string,
	database: PgDatabase,
) {
	return mockedMigratorLayer(
		databaseName,
		migrationFolder,
		database.camelCase,
	).pipe(
		Layer.provideMerge(mockedDbClientsLayer(databaseName, database.camelCase)),
	);
}
