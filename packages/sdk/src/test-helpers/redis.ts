import type { Redis } from "~workloads/workloads/stateful/redis.js";

/**
 * Deletes all the keys of a {@link Redis} workload database.
 */
export async function flushRedis(
	/**
	 * Redis workload
	 */

	workload: Redis,
	/**
	 * Redis database (default: 0)
	 */
	db?: number,
) {
	const Redis = (await import("ioredis")).Redis;
	const client = new Redis(process.env[workload.connectionStringEnvVar]!);
	if (db) {
		await client.select(db);
	}
	await client.flushdb();
	client.disconnect();
}
