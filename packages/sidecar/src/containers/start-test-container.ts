import type { SidecarContainer } from "~sidecar/containers/container.js";
import { RedisContainer } from "~sidecar/containers/redis.js";
import type { ContainerizedResource } from "~sidecar/resources/interfaces.js";
import type { Redis } from "~sidecar/resources/redis.js";

export async function startTestContainer(
	/**
	 * Resource
	 */
	resource: ContainerizedResource,
) {
	let container: SidecarContainer | undefined = undefined;
	const id = resource.id;

	if (isRedis(resource)) {
		container = new RedisContainer(resource, `${resource.id}-test`);
		return await container.start();
	}
	if (container === undefined) {
		throw new Error(`no container match for resource: ${id}`);
	}
}

function isRedis<C>(resource: unknown): resource is Redis<C> {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return (resource as any).constructor.name === "Redis";
}
