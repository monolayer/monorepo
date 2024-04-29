import type { Kysely } from "kysely";
import path from "path";
import { MonolayerConfig, type Configuration } from "./configuration.js";

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
		default: MonolayerConfig;
	};
};

type EsmConfig = {
	default: MonolayerConfig;
};

type ConfigImport = EsmConfig | CjsConfig;

export async function importConfig() {
	const def = await import(path.join(process.cwd(), "monolayer.config.ts"));
	const config: MonolayerConfig = isEsmImport(def)
		? def.default
		: def.default.default;
	return config;
}

type ConfigurationImport = Record<string, Configuration>;

export type SeedImport = {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	seed?: (db: Kysely<any>) => Promise<void>;
};

export async function importConfigurations() {
	const config = await importConfig();
	const configurations: ConfigurationImport = await import(
		path.join(process.cwd(), config.folder, "configuration.ts")
	);
	return configurations;
}

function isEsmImport(
	imported: ConfigImport,
): imported is { default: MonolayerConfig } {
	return !isCjsImport(imported);
}

function isCjsImport(
	imported: ConfigImport,
): imported is { default: { default: MonolayerConfig } } {
	return (
		(imported as { default: { default: MonolayerConfig } }).default.default !==
		undefined
	);
}
