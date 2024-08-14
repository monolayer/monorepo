import type { PgExtension } from "~pg/schema/extension.js";
import type { AnySchema } from "~pg/schema/schema.js";

export type DatabaseConfig = {
	id: string;
	schemas: AnySchema[];
	camelCase?: boolean;
	extensions?: PgExtension[];
	generatePrismaSchema?: boolean;
};

/**
 * @group Schema Definition
 * @category Database and Tables
 */
export function defineDatabase(config: DatabaseConfig) {
	return new MonoLayerPgDatabase(config);
}

/**
 * @group Classes, Types, and Interfaces
 * @category Classes
 */
export class MonoLayerPgDatabase {
	id: string;
	schemas: AnySchema[];
	generatePrismaSchema: boolean;
	extensions?: PgExtension[];
	camelCase: boolean;

	constructor(config: DatabaseConfig) {
		this.id = config.id;
		this.schemas = config.schemas;
		this.extensions = config.extensions;
		this.generatePrismaSchema = config.generatePrismaSchema ?? false;
		this.camelCase = config.camelCase ?? false;
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
