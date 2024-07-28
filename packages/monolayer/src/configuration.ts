import { type CamelCasePluginOptions } from "kysely";
import { type ClientConfig, type PoolConfig } from "pg";
import type { PgExtension } from "./database/extension/extension.js";
import type { AnySchema } from "./database/schema/schema.js";

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
