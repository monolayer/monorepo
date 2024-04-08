import {
	CamelCasePlugin,
	PostgresDialect,
	type CamelCasePluginOptions,
} from "kysely";
import pg, { type ClientConfig, type PoolConfig } from "pg";

export type EnvironmentConfig = ClientConfig & PoolConfig;

export type YountConfig = {
	folder: string;
};

export type ConnectionDefinition = {
	camelCasePlugin?: CamelCaseOptions;
	environments: {
		development: EnvironmentConfig;
	} & Record<string, EnvironmentConfig>;
};

export type Connections =
	| {
			default: ConnectionDefinition;
	  }
	| {
			[key: string]: ConnectionDefinition;
	  };

export type CamelCaseOptions = {
	enabled: boolean;
	options?: CamelCasePluginOptions;
};

export function kyselyConfig(
	connectionDefinition: ConnectionDefinition,
	environment: string,
) {
	const environmentConfig = connectionDefinition.environments[environment];
	return {
		dialect: new PostgresDialect({
			pool: new pg.Pool(environmentConfig),
		}),
		plugins: connectionDefinition.camelCasePlugin?.enabled
			? [new CamelCasePlugin(connectionDefinition.camelCasePlugin.options)]
			: [],
	};
}
