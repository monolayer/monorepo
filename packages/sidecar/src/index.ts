import { PostgresDatabase } from "~sidecar/workloads/stateful/postgres-database.js";
import { Redis } from "~sidecar/workloads/stateful/redis.js";

export const sc = {
	PostgresDatabase: PostgresDatabase,
	Redis: Redis,
};
