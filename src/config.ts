import type { ClientConfig, PoolConfig } from "pg";

export type Config = {
	folder: string;
	environments: {
		[key: string]: ClientConfig & PoolConfig;
	};
};

type GlobalsWithDatabaseSchema = typeof globalThis & {
	schema: unknown;
};

export function registerSchema(db: unknown) {
	const globalWithSchema = globalThis as GlobalsWithDatabaseSchema;

	if (globalWithSchema.schema === undefined) {
		globalWithSchema.schema = db;
	}
}
