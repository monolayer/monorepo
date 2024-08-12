import type { CamelCaseOptions } from "~/camel-case-options.js";
import type { PgExtension } from "~/schema/extension.js";
import type { AnySchema } from "~/schema/schema.js";

export type DatabaseConfig = {
	schemas: AnySchema[];
	camelCasePlugin?: CamelCaseOptions;
	extensions?: PgExtension[];
	generatePrismaSchema?: boolean;
};

export function defineDatabase(id: string, config: DatabaseConfig) {
	return new MonoLayerPgDatabase(id, config);
}

export class MonoLayerPgDatabase {
	schemas: AnySchema[];
	generatePrismaSchema: boolean;
	extensions?: PgExtension[];
	camelCase: CamelCaseOptions;

	constructor(
		public id: string,
		config: DatabaseConfig,
	) {
		this.schemas = config.schemas;
		this.extensions = config.extensions;
		this.generatePrismaSchema = config.generatePrismaSchema ?? false;
		this.camelCase = config.camelCasePlugin ?? { enabled: false };
	}

	get connectionString() {
		const envVar = `MONO_PG_${this.id.toUpperCase()}_DATABASE_URL`;
		const envConnectionString = process.env[envVar];
		if (envConnectionString) {
			return envConnectionString;
		} else {
			throw new Error(
				`No connection string found for database ${this.id}. Environment variable ${envVar} is undefined`,
			);
		}
	}
}
