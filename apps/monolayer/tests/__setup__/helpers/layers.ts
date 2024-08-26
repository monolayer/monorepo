import type { PgDatabase } from "@monorepo/pg/database.js";
import { phasedMigratorLayer } from "@monorepo/programs/phased-migrator.js";
import { DbClients } from "@monorepo/services/db-clients.js";
import dotenv from "dotenv";
import { Layer } from "effect";
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
		Layer.provideMerge(
			DbClients.TestLayer(globalPool(), databaseName, database.camelCase),
		),
	);
}
