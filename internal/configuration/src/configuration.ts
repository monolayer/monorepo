import type { CamelCaseOptions } from "@monorepo/pg/camel-case-options.js";
import type { PgExtension } from "@monorepo/pg/schema/extension.js";
import type { AnySchema } from "@monorepo/pg/schema/schema.js";
import { type ClientConfig, type PoolConfig } from "pg";

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
	generatePrismaSchema?: boolean;
};

export function defineConfig(config: Configuration) {
	return new MonolayerPgConfiguration(config);
}

export class MonolayerPgConfiguration {
	constructor(public configuration: Configuration) {
		this.configuration = configuration;
	}

	get schemas() {
		return this.configuration.schemas;
	}

	get extensions() {
		return this.configuration.extensions;
	}

	connection(environment: string) {
		return this.configuration.connections[environment] || {};
	}

	get camelCasePlugin() {
		return this.configuration.camelCasePlugin;
	}

	get camelCasePluginEnabled() {
		return this.configuration.camelCasePlugin?.enabled ?? false;
	}

	get camelCasePluginOptions() {
		return this.configuration.camelCasePlugin?.options ?? { enabled: false };
	}

	get generatePrismaSchema() {
		return this.configuration.generatePrismaSchema ?? false;
	}
}
