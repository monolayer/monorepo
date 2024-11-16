import { remember } from "@epic-web/remember";
import {
	getContainerRuntimeClient,
	type StartedTestContainer,
} from "testcontainers";
import { PostgreSQLContainer } from "~sidecar/containers.js";
import { createBucket } from "~sidecar/containers/admin/create-bucket.js";
import { createDatabase } from "~sidecar/containers/admin/create-database.js";
import { CONTAINER_LABEL_RESOURCE_ID } from "~sidecar/containers/container.js";
import { LocalStackContainer } from "~sidecar/containers/local-stack.js";
import { RedisContainer } from "~sidecar/containers/redis.js";
import type { Bucket } from "~sidecar/resources/bucket.js";
import { LocalStack } from "~sidecar/resources/local-stack.js";
import type { PostgresDatabase } from "~sidecar/resources/postgres-database.js";
import type { Redis } from "~sidecar/resources/redis.js";

function isRedis<C>(resource: unknown): resource is Redis<C> {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return (resource as any).constructor.name === "Redis";
}

function isBucket(resource: unknown): resource is Bucket {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return (resource as any).constructor.name === "Bucket";
}

function isPostgresDatabase<C>(
	resource: unknown,
): resource is PostgresDatabase<C> {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return (resource as any).constructor.name === "PostgresDatabase";
}

class ContainerStarter {
	async startContainerForResource(resource: unknown) {
		if (isRedis(resource)) {
			return await this.startRedis(resource);
		}
		if (isBucket(resource)) {
			const localStackContainer = await this.startLocalStack();
			await createBucket(resource.id, localStackContainer);
			return localStackContainer.startedContainer;
		}
		if (isPostgresDatabase(resource)) {
			let container: StartedTestContainer | undefined = undefined;
			if (await this.#containerForResource(resource.id)) {
				container = this.#postgresContainers.find(
					(c) => c.resourceId === resource.id,
				)?.container;
			} else {
				container = await this.startPostgres(resource);
				this.#postgresContainers.push({ container, resourceId: resource.id });
			}
			await createDatabase(resource);
			return container;
		}
	}

	async startRedis<C>(resource: Redis<C>) {
		const container = new RedisContainer(resource);
		return await container.start();
	}

	async startPostgres<C>(resource: PostgresDatabase<C>) {
		const container = new PostgreSQLContainer(resource);
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
			const localStackResource = new LocalStack("local-stack-testing");
			this.#localStackContainer = new LocalStackContainer(localStackResource);
			await this.#localStackContainer.start();
		}
		return this.#localStackContainer;
	}

	#postgresContainers: {
		container: StartedTestContainer;
		resourceId: string;
	}[] = [];

	async #containerForResource(resourceId: string) {
		const containerRuntimeClient = await getContainerRuntimeClient();
		return await containerRuntimeClient.container.fetchByLabel(
			CONTAINER_LABEL_RESOURCE_ID,
			resourceId,
			{ status: ["running"] },
		);
	}
}

export const containerStarter = remember(
	"containerStarter",
	() => new ContainerStarter(),
);
