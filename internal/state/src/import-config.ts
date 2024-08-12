import { Monolayer } from "@monorepo/configuration/configuration.js";
import type { MonoLayerPgDatabase } from "@monorepo/pg/database.js";
import type { Kysely } from "kysely";
import path from "path";

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
		default: Monolayer;
	};
};

type EsmConfig = {
	default: Monolayer;
};

type ConfigImport = EsmConfig | CjsConfig;

export async function importConfig() {
	const def = await import(path.join(process.cwd(), "monolayer.ts"));
	const config: Monolayer = isEsmImport(def)
		? def.default
		: def.default.default;
	return config;
}

export type ConfigurationImport = Record<string, MonoLayerPgDatabase>;

export type SeedImport = {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	seed?: (db: Kysely<any>) => Promise<void>;
};

export async function importConfigurations() {
	const config = await importConfig();
	const configurations: ConfigurationImport = await import(
		path.join(process.cwd(), config.folder, "databases.ts")
	);
	return configurations;
}

function isEsmImport(
	imported: ConfigImport,
): imported is { default: Monolayer } {
	return !isCjsImport(imported);
}

function isCjsImport(
	imported: ConfigImport,
): imported is { default: { default: Monolayer } } {
	return (
		(imported as { default: { default: Monolayer } }).default.default !==
		undefined
	);
}
