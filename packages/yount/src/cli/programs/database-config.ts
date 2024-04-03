import { Effect } from "effect";
import type { ClientConfig, PoolConfig } from "pg";
import type { ConnectionOptions } from "pg-connection-string";

export function databaseInConfig(
	config: (ClientConfig & PoolConfig) | ConnectionOptions,
) {
	const database = config.database;
	if (database === undefined || database === null) {
		return Effect.fail(new Error("Database not defined in configuration."));
	}
	return Effect.succeed(database);
}
