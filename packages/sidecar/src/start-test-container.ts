import type { StatefulResource } from "~sidecar/resources/stateful-resource.js";

export async function startTestContainer<C>(
	/**
	 * Resource
	 */
	resource: StatefulResource<C>,
) {
	const container = resource.container(`${resource.id}-test`);
	return await container.start();
}
