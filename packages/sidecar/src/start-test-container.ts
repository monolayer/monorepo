import type { Resource } from "~sidecar/resources/resource.js";

export async function startTestContainer<C>(
	/**
	 * Resource
	 */
	resource: Resource<C>,
) {
	const container = resource.container(`${resource.id}-test`);
	return await container.start();
}
