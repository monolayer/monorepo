import { Redis as IORedis } from "ioredis";
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
	const client = new IORedis(process.env[workload.connectionStringEnvVar]!);
	if (db) {
		await client.select(db);
	}
	await client.flushdb();
	client.disconnect();
}
