import { CamelCasePlugin, type CamelCasePluginOptions } from "kysely";
import pg, { type ClientConfig, type PoolConfig } from "pg";
import type { PgExtension } from "./database/extension/extension.js";
import type { AnySchema } from "./database/schema/schema.js";
import { MonolayerPostgresDialect } from "./services/db-clients.js";

export type PgConfig = ClientConfig & PoolConfig;

export type Monolayer = {
	folder: string;
};

export type Configuration = {
	schemas: AnySchema[];
	camelCasePlugin?: CamelCaseOptions;
	extensions?: PgExtension[];
	connections: {
		development: PgConfig;
	} & Record<string, PgConfig>;
};

export type CamelCaseOptions = {
	enabled: boolean;
	options?: CamelCasePluginOptions;
};

export function kyselyConfig(
	configuration: Configuration,
	environment: string,
) {
	const environmentConfig = configuration.connections[environment];
	return {
		dialect: new MonolayerPostgresDialect({
			pool: new pg.Pool(environmentConfig),
		}),
		plugins: configuration.camelCasePlugin?.enabled
			? [new CamelCasePlugin(configuration.camelCasePlugin.options)]
			: [],
	};
}
