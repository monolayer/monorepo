import { snakeCase } from "case-anything";
import { PostgreSQLContainer } from "~resources/databases/postgresql/container.js";

/**
 * PostgreSQL Database.
 *
 */
export class PostgreSQLDatabase {
	container: PostgreSQLContainer;

	constructor(public id: string) {
		this.container = new PostgreSQLContainer({
			resourceId: id,
			connectionStringEnvVarNames: [
				this.credentialsEnvVar,
				this.monoPgCredentialsEnvVar,
			],
		});
	}
	/**
	 * Returns the environment variable name that should contain the STMP connection URL.
	 */
	get credentialsEnvVar() {
		return `DATABASE_${snakeCase(this.id).toUpperCase()}_URL`;
	}

	get monoPgCredentialsEnvVar() {
		return `MONO_PG_${snakeCase(this.id).toUpperCase()}_DATABASE_URL`;
	}
}

export function definePostgreSQLDatabase(id: string) {
	return new PostgreSQLDatabase(id);
}
