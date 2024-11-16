import { remember } from "@epic-web/remember";
import { LocalStackContainer } from "~sidecar/containers/local-stack.js";
import { createBucket } from "~sidecar/containers/local-stack/create-bucket.js";
import { RedisContainer } from "~sidecar/containers/redis.js";
import type { Bucket } from "~sidecar/resources/bucket.js";
import { LocalStack } from "~sidecar/resources/local-stack.js";
import type { Redis } from "~sidecar/resources/redis.js";

function isRedis<C>(resource: unknown): resource is Redis<C> {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return (resource as any).constructor.name === "Redis";
}

function isBucket(resource: unknown): resource is Bucket {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return (resource as any).constructor.name === "Bucket";
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
	}

	async startRedis<C>(resource: Redis<C>) {
		const container = new RedisContainer(resource);
		return await container.start();
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
}

export const containerStarter = remember(
	"containerStarter",
	() => new ContainerStarter(),
);
