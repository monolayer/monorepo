import { env } from "node:process";
import dotenv from "dotenv";
import { Kysely, PostgresDialect } from "kysely";
import pg from "pg";
import type { GlobalThis } from "type-fest";
dotenv.config();

export type GlobalThisInTests = GlobalThis & {
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	kysely: Kysely<any> | undefined;
	pool: pg.Pool | undefined;
};

export interface DbContext {
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	kysely: Kysely<any>;
	tableNames: string[];
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
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
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
