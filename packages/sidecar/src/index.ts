import { PostgresDatabase } from "./resources/postgres-database.js";
import { Redis } from "./resources/redis.js";

export const sc = {
	PostgresDatabase: PostgresDatabase,
	Redis: Redis,
};
