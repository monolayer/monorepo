import pg from "pg";
import parse from "pg-connection-string";
import { ActionStatus, CommandError, CommandSuccess } from "./cli/command.js";
import { Config } from "./config.js";

export class DbAdmin {
	#pool: pg.Pool;
	#poolConfig: (pg.ClientConfig & pg.PoolConfig) | parse.ConnectionOptions;
	#config: Config;

	constructor(kineticConfig: Config, environment: string) {
		this.#config = kineticConfig;
		const poolConfig = this.#defaultPgPoolConfig(environment);
		this.#poolConfig = poolConfig;
		this.#pool = new pg.Pool({
			host: this.#poolConfig.host || "",
			port: this.#poolConfig.port
				? parseInt(this.#poolConfig.port.toString())
				: 5432,
			user: this.#poolConfig.user || "",
			password: this.#poolConfig.password || "",
		});
	}

	async createDb() {
		return this.#executeQuery({
			query: `CREATE DATABASE ${this.#poolConfig.database};`,
		});
	}

	async dropDb() {
		return this.#executeQuery({
			query: `DROP DATABASE ${this.#poolConfig.database};`,
		});
	}

	async close() {
		await this.#pool.end();
	}

	get databaseName() {
		return this.#poolConfig.database;
	}

	#defaultPgPoolConfig(env: string) {
		const poolConfig = this.#config.environments[env];
		if (poolConfig === undefined) {
			throw new Error(
				`No configuration found for environment: '${env}'. Please check your kinetic.js file.`,
			);
		}
		if (poolConfig.connectionString === undefined) {
			return poolConfig;
		}
		return parse.parse(poolConfig.connectionString);
	}

	async #executeQuery({
		query,
	}: { query: string }): Promise<CommandSuccess | CommandError> {
		try {
			await this.#pool.query(query);
			return {
				status: ActionStatus.Success,
			};
		} catch (error) {
			return {
				status: ActionStatus.Error,
				error: error as Error,
			};
		} finally {
			await this.#pool.end();
		}
	}
}
