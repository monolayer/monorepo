import { snakeCase } from "case-anything";
import type { Kysely } from "kysely";
import type { PgExtension } from "~pg/schema/extension.js";
import type { AnySchema } from "~pg/schema/schema.js";

export type DatabaseConfig = {
	/**
	 * Id of the database.
	 *
	 */
	id: string;
	/**
	 * Schemas in the database.
	 *
	 * @default []
	 */
	schemas?: AnySchema[];
	/**
	 * Extensions to install in the database.
	 *
	 * @default []
	 */
	extensions?: PgExtension[];
	/**
	 * Whether to convert camelCase column names to snake_case column names in the database.
	 *
	 * @default false
	 */
	camelCase?: boolean;
	/**
	 * Whether to generate a Prisma schema for the database after running migrations.
	 *
	 * @default false
	 */
	generatePrismaSchema?: boolean;

	/**
	 * Function to seed the database with data.
	 */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	seeder?: (db: Kysely<any>) => Promise<void>;
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
	/**
	 * Id of the database.
	 *
	 * @readonly
	 */
	readonly id: string;
	/**
	 * Schemas in the database.
	 *
	 * @readonly
	 * @default []
	 *
	 */
	readonly schemas: AnySchema[];
	/**
	 * Extensions to install in the database.
	 *
	 * @readonly
	 * @default []
	 *
	 */
	readonly extensions: PgExtension[];
	/**
	 * Whether to generate a Prisma schema for the database after running migrations.
	 *
	 * @readonly
	 * @default false
	 *
	 */
	readonly generatePrismaSchema: boolean;
	/**
	 * Whether to convert camelCase column names to snake_case column names in the database.
	 *
	 * @readonly
	 * @default false
	 *
	 */
	readonly camelCase: boolean;

	/**
	 * Function to seed the database with data.
	 *
	 * @readonly
	 */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	seeder?: (db: Kysely<any>) => Promise<void>;

	constructor(config: DatabaseConfig) {
		this.id = config.id;
		this.schemas = config.schemas ?? [];
		this.extensions = config.extensions ?? [];
		this.generatePrismaSchema = config.generatePrismaSchema ?? false;
		this.camelCase = config.camelCase ?? false;
		this.seeder = config.seeder;
	}

	/**
	 * Get the connection string for the database.
	 *
	 * It will fetch he connection string from by inferring the environment variable in the following format:
	 *
	 * `MONO_PG_${DATABASE_ID_TO_UPPER_CASE_AND_SNAKE_CASE}_DATABASE_URL`.
	 *
	 * @example
	 * For the following database:
	 *
	 * ```ts
	 * const db = defineDatabase({
	 * 	id: "my-db",
	 * 	schemas: [],
	 * });
	 * ```
	 *
	 * The connection string will be fetched from the environment variable:
	 * `MONO_PG_MY_DB_DATABASE_URL`
	 */
	get connectionString() {
		const envConnectionString = process.env[this.envVar];
		if (envConnectionString) {
			return envConnectionString;
		} else {
			throw new Error(
				`No connection string found for database ${this.id}. Environment variable ${this.envVar} is undefined`,
			);
		}
	}

	/**
	 * Environment variable name for the database connection string.
	 *
	 * @internal
	 */
	get envVar() {
		return `MONO_PG_${snakeCase(this.id).toUpperCase()}_DATABASE_URL`;
	}
}
