import type { Kysely } from "kysely";
import path from "path";
import { Connectors, YountConfig } from "./configuration.js";

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
		default: YountConfig;
	};
};

type EsmConfig = {
	default: YountConfig;
};

type ConfigImport = EsmConfig | CjsConfig;

export async function importConfig() {
	const def = await import(path.join(process.cwd(), "yount.config.ts"));
	const config: YountConfig = isEsmImport(def)
		? def.default
		: def.default.default;
	return config;
}

type ConnectorImport = {
	connectors?: Connectors;
};

export type SeedImport = {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	seed?: (db: Kysely<any>) => Promise<void>;
};

export async function importConnector() {
	const config = await importConfig();
	const connectors: ConnectorImport = await import(
		path.join(process.cwd(), config.folder, "connectors.ts")
	);
	return connectors;
}

function isEsmImport(
	imported: ConfigImport,
): imported is { default: YountConfig } {
	return !isCjsImport(imported);
}

function isCjsImport(
	imported: ConfigImport,
): imported is { default: { default: YountConfig } } {
	return (
		(imported as { default: { default: YountConfig } }).default.default !==
		undefined
	);
}
