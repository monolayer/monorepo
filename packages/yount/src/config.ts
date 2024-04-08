import type { Kysely } from "kysely";
import path from "path";
import { Connections, YountConfig } from "./configuration.js";
import type { AnyPgDatabase } from "./schema/pg-database.js";

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

type SchemaImport = {
	database?: AnyPgDatabase;
};

type ConnectionsImport = {
	connections?: Connections;
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

export async function importConnections() {
	const config = await importConfig();
	const connections: ConnectionsImport = await import(
		path.join(process.cwd(), config.folder, "connections.ts")
	);
	return connections;
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
