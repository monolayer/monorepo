import type { CamelCasePluginOptions, Kysely } from "kysely";
import path from "path";
import type { ClientConfig, PoolConfig } from "pg";
import { type AnyPgDatabase } from "./schema/pg_database.js";

export type Config = {
	folder: string;
	environments: {
		[key: string]: ClientConfig & PoolConfig;
	};
	future?: {
		unstable_auto_migrations: boolean;
	};
	camelCasePlugin?: CamelCaseOptions;
};

export type CamelCaseOptions = {
	enabled: boolean;
	options?: CamelCasePluginOptions;
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

type CjsConfig = {
	default: {
		default: Config;
	};
};

type EsmConfig = {
	default: Config;
};

type ConfigImport = EsmConfig | CjsConfig;

export async function importConfig() {
	const def = await import(path.join(process.cwd(), "kinetic.ts"));
	const config: Config = isEsmImport(def) ? def.default : def.default.default;
	return config;
}

type SchemaImport = {
	database?: AnyPgDatabase;
};

export type SeedImport = {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	seed?: (db: Kysely<any>) => Promise<void>;
};

export async function importSchema() {
	const config = await importConfig();
	const schema: SchemaImport = await import(
		path.join(process.cwd(), config.folder, "schema.ts")
	);
	return schema;
}

export async function importSeedFunction() {
	const config = await importConfig();
	const seedImport: SeedImport = await import(
		path.join(process.cwd(), config.folder, "seed.ts")
	);
	return seedImport;
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
