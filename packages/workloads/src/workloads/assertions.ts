import type { Bucket } from "~workloads/workloads/stateful/bucket.js";
import type { MySqlDatabase } from "~workloads/workloads/stateful/mysql-database.js";
import type { PostgresDatabase } from "~workloads/workloads/stateful/postgres-database.js";
import type { Redis } from "~workloads/workloads/stateful/redis.js";
import type { Cron } from "~workloads/workloads/stateless/cron.js";
import type { Task } from "~workloads/workloads/stateless/task/task.js";
import type { Workload } from "~workloads/workloads/workload.js";

export function assertRedis<C>(
	workload: Workload,
): asserts workload is Redis<C> {}

export function assertPostgresDatabase<C>(
	workload: Workload,
): asserts workload is PostgresDatabase<C> {}

export function assertMySqlDatabase<C>(
	workload: Workload,
): asserts workload is MySqlDatabase<C> {}

export function assertBucket(workload: Workload): asserts workload is Bucket {}

export function assertCron(workload: Workload): asserts workload is Cron {}

export function assertTask(
	workload: Workload,
): asserts workload is Task<unknown> {}
