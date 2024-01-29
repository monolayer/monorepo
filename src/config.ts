import path from "path";
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

type ConfigImport =
	| {
			default: Config;
	  }
	| {
			default: {
				default: Config;
			};
	  };

export async function importConfig() {
	const def = await import(path.join(process.cwd(), "kinetic.ts"));
	const config: Config = isEsmImport(def) ? def.default : def.default.default;
	return config;
}

function isEsmImport(imported: ConfigImport): imported is { default: Config } {
	return !isCjsImport(imported);
}

function isCjsImport(
	imported: ConfigImport,
): imported is { default: { default: Config } } {
	return (
		(imported as { default: { default: Config } }).default.default !== undefined
	);
}
