import dotenv from "dotenv";
import { Kysely, Migrator, PostgresDialect } from "kysely";
import { env } from "node:process";
import pg from "pg";
import type { GlobalThis } from "type-fest";
dotenv.config();

export type GlobalThisInTests = GlobalThis & {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	kysely: Kysely<any> | undefined;
	pool: pg.Pool | undefined;
};

export interface DbContext {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	kysely: Kysely<any>;
	migrator: Migrator;
	tableNames: string[];
	dbName: string;
	folder: string;
}

export function globalPool() {
	const globalTestThis = globalThis as GlobalThisInTests;

	if (globalTestThis.pool === undefined) {
		globalTestThis.pool = new pg.Pool({ connectionString: env.POSTGRES_URL });
	}
	return globalTestThis.pool;
}

export function globalKysely() {
	const globalTestThis = globalThis as GlobalThisInTests;

	if (globalTestThis.kysely === undefined) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		globalTestThis.kysely = new Kysely<any>({
			dialect: new PostgresDialect({
				pool: new pg.Pool({
					connectionString: env.DATABASE_URL,
				}),
			}),
		});
	}
	return globalTestThis.kysely;
}
