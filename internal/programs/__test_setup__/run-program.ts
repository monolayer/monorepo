import { MonoLayerPgDatabase } from "@monorepo/pg/database.js";
import { text } from "@monorepo/pg/schema/column/data-types/text.js";
import { schema } from "@monorepo/pg/schema/schema.js";
import { table } from "@monorepo/pg/schema/table.js";
import { phasedMigratorLayer } from "@monorepo/programs/phased-migrator.js";
import { DbClients } from "@monorepo/services/db-clients.js";
import {
	AppEnvironment,
	type AppEnv,
} from "@monorepo/state/app-environment.js";
import { Effect, Layer } from "effect";
import { Kysely, PostgresDialect } from "kysely";
import path from "node:path";
import { env } from "node:process";
import pg from "pg";
import type { TaskContext } from "vitest";
import { pgAdminPool } from "~test-setup/pool.js";
import {
	migrationFolder,
	programFolder,
	testDatabaseName,
} from "~test-setup/program_context.js";

export function runProgram<A, E, R>(
	program: Effect.Effect<A, E, R>,
	context: TaskContext,
) {
	const folder = programFolder(context);
	const env: AppEnv = {
		databases: path.join(folder, "databases.ts"),
		currentDatabase: new MonoLayerPgDatabase({
			id: "default",
			schemas: [dbSchema],
			camelCase: false,
			extensions: [],
		}),
	};

	return Effect.scoped(
		AppEnvironment.provide(Effect.provide(program, testLayers(context)), env),
	);
}

const dbSchema = schema({
	tables: {
		regulus_mint: table({
			columns: {
				name: text().notNull(),
			},
		}),
		regulur_door: table({
			columns: {
				name: text().notNull(),
			},
		}),
		alphard_black: table({
			columns: {
				name: text().notNull(),
			},
		}),
		mirfak_mustart: table({
			columns: {
				name: text().notNull(),
			},
		}),
	},
});

function testLayers(context: TaskContext) {
	const databaseName = testDatabaseName(context);
	const pool = new pg.Pool({
		database: databaseName,
		user: env.POSTGRES_USER,
		password: env.POSTGRES_PASSWORD,
		host: env.POSTGRES_HOST,
		port: Number(env.POSTGRES_PORT ?? 5432),
	});
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const db = new Kysely<any>({
		dialect: new PostgresDialect({
			pool: pool,
		}),
		plugins: [],
	});

	const dbClientsLayer = Layer.effect(
		DbClients,
		// eslint-disable-next-line require-yield
		Effect.gen(function* () {
			const adminPool = pgAdminPool();
			return {
				pgPool: pool,
				pgAdminPool: adminPool,
				databaseName,
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				kysely: new Kysely<any>({
					dialect: new PostgresDialect({
						pool: pool,
					}),
					plugins: [],
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
	return phasedMigratorLayer({
		client: db,
		migrationFolder: migrationFolder(context),
	}).pipe(Layer.provideMerge(dbClientsLayer));
}
