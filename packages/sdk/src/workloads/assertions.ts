import type { Bucket } from "~workloads/workloads/stateful/bucket.js";
import type { PostgresDatabase } from "~workloads/workloads/stateful/postgres-database.js";
import type { Redis } from "~workloads/workloads/stateful/redis.js";
import type { Cron } from "~workloads/workloads/stateless/cron.js";
import type { Task } from "~workloads/workloads/stateless/task/task.js";
import type { Workload } from "~workloads/workloads/workload.js";
import type { AnyBroadcast } from "./stateless/broadcast/router.js";

export function assertRedis(workload: Workload): asserts workload is Redis {}

export function assertPostgresDatabase(
	workload: Workload,
): asserts workload is PostgresDatabase {}

export function assertBucket(
	workload: Workload,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
): asserts workload is Bucket<any> {}

export function assertCron(workload: Workload): asserts workload is Cron {}

export function assertTask(
	workload: Workload,
): asserts workload is Task<unknown> {}

export function assertBroadcast(
	workload: Workload,
): asserts workload is AnyBroadcast {}
