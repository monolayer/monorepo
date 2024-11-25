import type { Bucket } from "~workloads/workloads/stateful/bucket.js";
import type { ElasticSearch } from "~workloads/workloads/stateful/elastic-search.js";
import type { Mailer } from "~workloads/workloads/stateful/mailer.js";
import type { MongoDatabase } from "~workloads/workloads/stateful/mongo-database.js";
import type { MySqlDatabase } from "~workloads/workloads/stateful/mysql-database.js";
import type { PostgresDatabase } from "~workloads/workloads/stateful/postgres-database.js";
import type { Redis } from "~workloads/workloads/stateful/redis.js";
import type { Workload } from "~workloads/workloads/workload.js";

export function assertRedis<C>(
	workload: Workload,
): asserts workload is Redis<C> {}

export function assertElasticSearch<C>(
	workload: Workload,
): asserts workload is ElasticSearch<C> {}

export function assertMongoDatabase<C>(
	workload: Workload,
): asserts workload is MongoDatabase<C> {}

export function assertPostgresDatabase<C>(
	workload: Workload,
): asserts workload is PostgresDatabase<C> {}

export function assertMailer<C>(
	workload: Workload,
): asserts workload is Mailer<C> {}

export function assertMySqlDatabase<C>(
	workload: Workload,
): asserts workload is MySqlDatabase<C> {}

export function assertBucket<C>(
	workload: Workload,
): asserts workload is Bucket<C> {}
