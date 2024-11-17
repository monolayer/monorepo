import { PostgresDatabase } from "~sidecar/workloads/postgres-database.js";
import { Redis } from "~sidecar/workloads/redis.js";

export const sc = {
	PostgresDatabase: PostgresDatabase,
	Redis: Redis,
};
