import { remember } from "@epic-web/remember";
import { RedisContainer } from "~sidecar/containers/redis.js";
import type { Redis } from "~sidecar/resources/redis.js";

function isRedis<C>(resource: unknown): resource is Redis<C> {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return (resource as any).constructor.name === "Redis";
}

class ContainerStarter {
	async startContainerForResource(resource: unknown) {
		if (isRedis(resource)) {
			return await this.startRedis(resource);
		}
	}

	async startRedis<C>(resource: Redis<C>) {
		const container = new RedisContainer(resource, `${resource.id}-test`);
		return await container.start();
	}
}

export const containerStarter = remember(
	"containerStarter",
	() => new ContainerStarter(),
);
