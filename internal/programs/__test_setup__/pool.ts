import dotenv from "dotenv";
import path from "node:path";
import pg from "pg";
import type { GlobalThis } from "type-fest";
import { currentWorkingDirectory } from "~test-setup/program_context.js";

type GlobalThisInTests = GlobalThis & {
	adminPool: pg.Pool | undefined;
	pool: pg.Pool | undefined;
};

export function pgAdminPool() {
	const globalTestThis = globalThis as GlobalThisInTests;

	if (globalTestThis.adminPool === undefined) {
		const envObj: Record<string, string> = {};
		dotenv.config({
			path: path.resolve(currentWorkingDirectory(), ".env.test"),
			processEnv: envObj,
		});
		globalTestThis.adminPool = new pg.Pool({
			user: envObj.POSTGRES_USER ?? process.env.POSTGRES_USER,
			password: envObj.POSTGRES_PASSWORD ?? process.env.POSTGRES_PASSWORD,
			host: envObj.POSTGRES_HOST ?? process.env.POSTGRES_HOST,
			port: Number(envObj.POSTGRES_PORT ?? process.env.POSTGRES_PORT ?? 5432),
		});
	}
	return globalTestThis.adminPool;
}

export function pgPool(databaseName: string) {
	const envObj: Record<string, string> = {};
	dotenv.config({
		path: path.resolve(currentWorkingDirectory(), ".env.test"),
		processEnv: envObj,
	});
	return new pg.Pool({
		user: envObj.POSTGRES_USER ?? process.env.POSTGRES_USER,
		password: envObj.POSTGRES_PASSWORD ?? process.env.POSTGRES_PASSWORD,
		host: envObj.POSTGRES_HOST ?? process.env.POSTGRES_HOST,
		port: Number(envObj.POSTGRES_PORT ?? process.env.POSTGRES_PORT ?? 5432),
		database: databaseName,
	});
}
