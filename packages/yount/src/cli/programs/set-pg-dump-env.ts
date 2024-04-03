import { Effect } from "effect";
import type { ClientConfig, PoolConfig } from "pg";
import type { ConnectionOptions } from "pg-connection-string";
import { env } from "process";

export function setPgDumpEnv(
	config: (ClientConfig & PoolConfig) | ConnectionOptions,
) {
	env.PGHOST = `${config.host}`;
	env.PGPORT = `${config.port}`;
	env.PGUSER = `${config.user}`;
	env.PGPASSWORD = `${config.password}`;
	return Effect.succeed(true);
}
