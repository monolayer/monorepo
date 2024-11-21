import { createClient } from "redis";
import type { Redis } from "~workloads/workloads/stateful/redis.js";

/**
 * Deletes all the keys of a {@link Redis} workload database.
 */
export async function flushRedis(
	/**
	 * Redis workload
	 */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	workload: Redis<any>,
	/**
	 * Redis database (default: 0)
	 */
	db?: number,
) {
	const client = createClient({
		url: process.env[workload.connectionStringEnvVar],
	}).on("error", (err) => console.error("Redis Client Error", err));
	await client.connect();
	if (db) {
		await client.select(db);
	}
	await client.FLUSHDB();
	await client.disconnect();
}
