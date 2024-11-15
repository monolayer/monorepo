import type { ResourceContainer } from "~sidecar/container.js";
import type { GenericResource } from "~sidecar/resources/generic-resource.js";

export async function startTestContainer(
	/**
	 * Resource
	 */
	resource: GenericResource & ResourceContainer,
) {
	const container = resource.container(`${resource.id}-test`);
	return await container.start();
}
