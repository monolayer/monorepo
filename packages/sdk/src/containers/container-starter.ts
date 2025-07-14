import { remember } from "@epic-web/remember";
import { MinioContainer } from "~workloads/containers/minio.js";
import { PostgreSQLContainer } from "~workloads/containers/postgresql.js";
import { RedisContainer } from "~workloads/containers/redis.js";
import {
	assertBroadcast,
	assertBucket,
	assertPostgresDatabase,
	assertRedis,
} from "~workloads/workloads/assertions.js";
import type { Workload } from "~workloads/workloads/workload.js";
import { BroadcastContainer } from "./broadcast.js";

class ContainerStarter {
	async startForWorload(
		workload: Workload,
		options: {
			mode: "dev" | "test";
			waitForHealthcheck: boolean;
		},
	) {
		const container = this.workloadContainer(workload);
		container.mode = options.mode;
		return await container.start(options.waitForHealthcheck);
	}

	private workloadContainer(workload: Workload) {
		switch (workload.constructor.name) {
			case "Redis":
				assertRedis(workload);
				return new RedisContainer(workload);
			case "PostgresDatabase":
				assertPostgresDatabase(workload);
				return new PostgreSQLContainer(workload);
			case "Bucket":
				assertBucket(workload);
				return new MinioContainer(workload);
			case "Broadcast":
				assertBroadcast(workload);
				return new BroadcastContainer(workload);
			default:
				throw new Error(`Missing container for ${workload.constructor.name}`);
		}
	}
}

export const containerStarter = remember(
	"containerStarter",
	() => new ContainerStarter(),
);
