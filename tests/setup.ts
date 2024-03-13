import dotenv from "dotenv";
import { env } from "node:process";
import pg from "pg";
import type { GlobalThis } from "type-fest";
dotenv.config();

export type GlobalThisInTests = GlobalThis & {
	pool: pg.Pool | undefined;
};

export function globalPool() {
	const globalTestThis = globalThis as GlobalThisInTests;

	if (globalTestThis.pool === undefined) {
		globalTestThis.pool = new pg.Pool({ connectionString: env.POSTGRES_URL });
	}
	return globalTestThis.pool;
}
