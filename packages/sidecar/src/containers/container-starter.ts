import { remember } from "@epic-web/remember";
import {
	getContainerRuntimeClient,
	type StartedTestContainer,
} from "testcontainers";
import { PostgreSQLContainer } from "~sidecar/containers.js";
import { createBucket } from "~sidecar/containers/admin/create-bucket.js";
import { createDatabase } from "~sidecar/containers/admin/create-database.js";
import { CONTAINER_LABEL_WORKLOAD_ID } from "~sidecar/containers/container.js";
import { LocalStackContainer } from "~sidecar/containers/local-stack.js";
import { RedisContainer } from "~sidecar/containers/redis.js";
import type { Bucket } from "~sidecar/workloads/bucket.js";
import { LocalStack } from "~sidecar/workloads/local-stack.js";
import type { PostgresDatabase } from "~sidecar/workloads/postgres-database.js";
import type { Redis } from "~sidecar/workloads/redis.js";

function isRedis<C>(workload: unknown): workload is Redis<C> {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return (workload as any).constructor.name === "Redis";
}

function isBucket(workload: unknown): workload is Bucket {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return (workload as any).constructor.name === "Bucket";
}

function isPostgresDatabase<C>(
	workload: unknown,
): workload is PostgresDatabase<C> {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return (workload as any).constructor.name === "PostgresDatabase";
}

class ContainerStarter {
	async startContainerForWorkload(workload: unknown) {
		if (isRedis(workload)) {
			return await this.startRedis(workload);
		}
		if (isBucket(workload)) {
			const localStackContainer = await this.startLocalStack();
			await createBucket(workload.id, localStackContainer);
			return localStackContainer.startedContainer;
		}
		if (isPostgresDatabase(workload)) {
			let container: StartedTestContainer | undefined = undefined;
			if (await this.#containerForWorkload(workload.id)) {
				container = this.#postgresContainers.find(
					(c) => c.workloadId === workload.id,
				)?.container;
			} else {
				container = await this.startPostgres(workload);
				this.#postgresContainers.push({ container, workloadId: workload.id });
			}
			await createDatabase(workload);
			return container;
		}
	}

	async startRedis<C>(workload: Redis<C>) {
		const container = new RedisContainer(workload);
		return await container.start();
	}

	async startPostgres<C>(workload: PostgresDatabase<C>) {
		const container = new PostgreSQLContainer(workload);
		return await container.start({
			persistenceVolumes: true,
			reuse: true,
		});
	}

	#localStackContainer?: LocalStackContainer;

	async localStackContainer() {
		if (this.#localStackContainer === undefined) {
			return await this.startLocalStack();
		}
		return this.#localStackContainer;
	}
	async startLocalStack() {
		if (this.#localStackContainer === undefined) {
			const localStackWorkload = new LocalStack("local-stack-testing");
			this.#localStackContainer = new LocalStackContainer(localStackWorkload);
			await this.#localStackContainer.start();
		}
		return this.#localStackContainer;
	}

	#postgresContainers: {
		container: StartedTestContainer;
		workloadId: string;
	}[] = [];

	async #containerForWorkload(workloadId: string) {
		const containerRuntimeClient = await getContainerRuntimeClient();
		return await containerRuntimeClient.container.fetchByLabel(
			CONTAINER_LABEL_WORKLOAD_ID,
			workloadId,
			{ status: ["running"] },
		);
	}
}

export const containerStarter = remember(
	"containerStarter",
	() => new ContainerStarter(),
);
