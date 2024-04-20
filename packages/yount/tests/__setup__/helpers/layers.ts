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
import type { Connector } from "~/configuration.js";
import { DbClients, dbClientsLayer } from "~/services/dbClients.js";
import {
	DevEnvironment,
	Environment,
	devEnvironmentLayer,
	environmentLayer,
} from "~/services/environment.js";
import { Migrator, migratorLayer } from "~/services/migrator.js";
import { globalPool } from "../setup.js";
dotenv.config();

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
	const pool = pgPool(databaseName);
	return Layer.effect(
		DbClients,
		// eslint-disable-next-line require-yield
		Effect.gen(function* () {
			const adminPool = globalPool();
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
	const pool = pgPool(databaseName);
	return Layer.effect(
		Migrator,
		// eslint-disable-next-line require-yield
		Effect.gen(function* () {
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
	connector: EnvironmentLessConnector,
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
					schemas: connector.schemas,
					extensions: connector.extensions,
					environments: {
						development: {},
					},
				},
				connectorConfig: {},
				camelCasePlugin: connector.camelCasePlugin,
			};
		}),
	);
}

function mockedDevEnvironmentLayer(
	migrationFolder: string,
	connector: EnvironmentLessConnector,
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
					schemas: connector.schemas,
					extensions: connector.extensions,
					environments: {
						development: {},
					},
				},
				connectorConfig: {},
				camelCasePlugin: connector.camelCasePlugin,
			};
		}),
	);
}

export type EnvironmentLessConnector = Omit<Connector, "environments">;

export function newLayers(
	databaseName: string,
	migrationFolder: string,
	connector: EnvironmentLessConnector,
) {
	return mockedMigratorLayer(
		databaseName,
		migrationFolder,
		connector.camelCasePlugin,
	).pipe(
		Layer.provideMerge(
			mockedDbClientsLayer(databaseName, connector.camelCasePlugin),
		),
		Layer.provideMerge(mockedEnvironmentLayer(migrationFolder, connector)),
		Layer.provideMerge(mockedDevEnvironmentLayer(migrationFolder, connector)),
	);
}

export const layers = migratorLayer().pipe(
	Layer.provideMerge(dbClientsLayer()),
	Layer.provideMerge(environmentLayer("development", "default")),
	Layer.provideMerge(devEnvironmentLayer("default")),
);
