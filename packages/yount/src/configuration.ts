import {
	CamelCasePlugin,
	PostgresDialect,
	type CamelCasePluginOptions,
} from "kysely";
import pg, { type ClientConfig, type PoolConfig } from "pg";
import type { AnyPgDatabase } from "./schema/pg-database.js";

export type PgConfig = ClientConfig & PoolConfig;

export type YountConfig = {
	folder: string;
};

export type Connector = {
	databaseSchema: AnyPgDatabase[];
	camelCasePlugin?: CamelCaseOptions;
	environments: {
		development: PgConfig;
	} & Record<string, PgConfig>;
};

export type Connectors =
	| {
			default: Connector;
	  }
	| {
			[key: string]: Connector;
	  };

export type CamelCaseOptions = {
	enabled: boolean;
	options?: CamelCasePluginOptions;
};

export function kyselyConfig(connector: Connector, environment: string) {
	const environmentConfig = connector.environments[environment];
	return {
		dialect: new PostgresDialect({
			pool: new pg.Pool(environmentConfig),
		}),
		plugins: connector.camelCasePlugin?.enabled
			? [new CamelCasePlugin(connector.camelCasePlugin.options)]
			: [],
	};
}
