import type { CamelCaseOptions } from "~/camel-case-options.js";
import type { PgExtension } from "~/schema/extension.js";
import type { AnySchema } from "~/schema/schema.js";

export type DatabaseConfig = {
	schemas: AnySchema[];
	camelCasePlugin?: CamelCaseOptions;
	extensions?: PgExtension[];
	generatePrismaSchema?: boolean;
};

export function defineDatabase(config: DatabaseConfig) {
	return new MonoLayerPgDatabase(config);
}

export class MonoLayerPgDatabase {
	schemas: AnySchema[];
	generatePrismaSchema: boolean;
	extensions?: PgExtension[];
	camelCase: CamelCaseOptions;

	constructor(config: DatabaseConfig) {
		this.schemas = config.schemas;
		this.extensions = config.extensions;
		this.generatePrismaSchema = config.generatePrismaSchema ?? false;
		this.camelCase = config.camelCasePlugin ?? { enabled: false };
	}
}
