import type { ContainerizedResource } from "~sidecar/resources/containerized-resource.js";

export async function startTestContainer(
	/**
	 * Resource
	 */
	resource: ContainerizedResource,
) {
	const container = resource.container(`${resource.id}-test`);
	return await container.start();
}
