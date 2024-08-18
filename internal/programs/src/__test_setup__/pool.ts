import dotenv from "dotenv";
import path from "node:path";
import pg from "pg";
import type { GlobalThis } from "type-fest";
import { currentWorkingDirectory } from "~programs/__test_setup__/program_context.js";

type GlobalThisInTests = GlobalThis & {
	pool: pg.Pool | undefined;
	poolTwo: pg.Pool | undefined;
};

export function pgAdminPool() {
	const globalTestThis = globalThis as GlobalThisInTests;

	if (globalTestThis.pool === undefined) {
		const envObj: Record<string, string> = {};
		dotenv.config({
			path: path.resolve(currentWorkingDirectory(), ".env.test"),
			processEnv: envObj,
		});
		globalTestThis.pool = new pg.Pool({
			user: envObj.POSTGRES_USER,
			password: envObj.POSTGRES_PASSWORD,
			host: envObj.POSTGRES_HOST,
			port: Number(envObj.POSTGRES_PORT ?? 5432),
		});
	}
	return globalTestThis.pool;
}
