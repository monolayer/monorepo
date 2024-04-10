import dotenv from "dotenv";
import { Effect, Layer } from "effect";
import {
	CamelCasePlugin,
	FileMigrationProvider,
	Kysely,
	Migrator as KyselyMigrator,
	PostgresDialect,
} from "kysely";
import fs from "node:fs/promises";
import path from "path";
import pg from "pg";
import { env } from "process";
import {
	DbClients,
	dbClientsLayer,
	type DbClientProperties,
} from "~/cli/services/dbClients.js";
import {
	DevEnvironment,
	Environment,
	devEnvironmentLayer,
	environmentLayer,
} from "~/cli/services/environment.js";
import { Migrator, migratorLayer } from "~/cli/services/migrator.js";
import type { AnySchema } from "~/schema/schema.js";
dotenv.config();

export class dbClientsMock implements DbClientProperties {
	readonly currentEnvironment: DbClientProperties["currentEnvironment"];
	readonly developmentEnvironment: DbClientProperties["developmentEnvironment"];
	constructor(databaseName: string) {
		const pool = new pg.Pool({
			database: databaseName,
			user: env.POSTGRES_USER,
			password: env.POSTGRES_PASSWORD,
			host: env.POSTGRES_HOST,
			port: Number(env.POSTGRES_ONE_PORT ?? 5432),
		});
		const adminPool = new pg.Pool({
			user: env.POSTGRES_USER,
			password: env.POSTGRES_PASSWORD,
			host: env.POSTGRES_HOST,
			port: Number(env.POSTGRES_ONE_PORT ?? 5432),
		});

		this.currentEnvironment = {
			databaseName: databaseName,
			pgPool: pool,
			pgAdminPool: adminPool,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			kysely: new Kysely<any>({
				dialect: new PostgresDialect({
					pool: pool,
				}),
			}),
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			kyselyNoCamelCase: new Kysely<any>({
				dialect: new PostgresDialect({
					pool: pool,
				}),
			}),
		};
		this.developmentEnvironment = this.currentEnvironment;
	}
}

function pgPool(database?: string) {
	return new pg.Pool({
		database,
		user: env.POSTGRES_USER,
		password: env.POSTGRES_PASSWORD,
		host: env.POSTGRES_HOST,
		port: Number(env.POSTGRES_ONE_PORT ?? 5432),
	});
}

export function mockedDbClientsLayer(
	databaseName: string,
	useCamelCase = { enabled: false },
) {
	return Layer.effect(
		DbClients,
		// eslint-disable-next-line require-yield
		Effect.gen(function* () {
			const pool = pgPool(databaseName);
			const adminPool = pgPool(undefined);
			const currentEnvironment = {
				databaseName: databaseName,
				pgPool: pool,
				pgAdminPool: adminPool,
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				kysely: new Kysely<any>({
					dialect: new PostgresDialect({
						pool: pool,
					}),
					plugins: useCamelCase.enabled ? [new CamelCasePlugin()] : [],
				}),
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				kyselyNoCamelCase: new Kysely<any>({
					dialect: new PostgresDialect({
						pool: pool,
					}),
				}),
			};
			return {
				currentEnvironment,
				developmentEnvironment: currentEnvironment,
			};
		}),
	);
}

function mockedMigratorLayer(
	databaseName: string,
	folder: string,
	useCamelCase = { enabled: false },
) {
	return Layer.effect(
		Migrator,
		// eslint-disable-next-line require-yield
		Effect.gen(function* () {
			const pool = pgPool(databaseName);
			return {
				instance: new KyselyMigrator({
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					db: new Kysely<any>({
						dialect: new PostgresDialect({
							pool: pool,
						}),
						plugins: useCamelCase.enabled ? [new CamelCasePlugin()] : [],
					}),
					provider: new FileMigrationProvider({
						fs,
						path,
						migrationFolder: folder,
					}),
				}),
				folder: folder,
			};
		}),
	);
}

function mockedEnvironmentLayer(
	migrationFolder: string,
	schemas: AnySchema[],
	useCamelCase = { enabled: false },
) {
	return Layer.effect(
		Environment,
		// eslint-disable-next-line require-yield
		Effect.gen(function* () {
			return {
				name: "development",
				connectorName: "default",
				folder: "migrations",
				migrationFolder: migrationFolder,
				connector: {
					schemas: schemas,
					environments: {
						development: {},
					},
				},
				connectorConfig: {},
				camelCasePlugin: useCamelCase,
			};
		}),
	);
}

function mockedDevEnvironmentLayer(
	migrationFolder: string,
	schemas: AnySchema[],
	useCamelCase = { enabled: false },
) {
	return Layer.effect(
		DevEnvironment,
		// eslint-disable-next-line require-yield
		Effect.gen(function* () {
			return {
				name: "development",
				connectorName: "default",
				folder: "migrations",
				migrationFolder: migrationFolder,
				connector: {
					schemas: schemas,
					environments: {
						development: {},
					},
				},
				connectorConfig: {},
				camelCasePlugin: useCamelCase,
			};
		}),
	);
}

export function newLayers(
	databaseName: string,
	migrationFolder: string,
	schemas: AnySchema[],
	useCamelCase = { enabled: false },
) {
	return mockedMigratorLayer(databaseName, migrationFolder, useCamelCase).pipe(
		Layer.provideMerge(mockedDbClientsLayer(databaseName, useCamelCase)),
		Layer.provideMerge(
			mockedEnvironmentLayer(migrationFolder, schemas, useCamelCase),
		),
		Layer.provideMerge(
			mockedDevEnvironmentLayer(migrationFolder, schemas, useCamelCase),
		),
	);
}

export const layers = migratorLayer().pipe(
	Layer.provideMerge(dbClientsLayer()),
	Layer.provideMerge(environmentLayer("development", "default")),
	Layer.provideMerge(devEnvironmentLayer("default")),
);
