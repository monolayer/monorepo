import type { ResourceContainer } from "~sidecar/container.js";

export async function startTestContainer(
	/**
	 * Resource
	 */
	resource: ResourceContainer,
) {
	const container = resource.container(`${resource.id}-test`);
	return await container.start();
}
