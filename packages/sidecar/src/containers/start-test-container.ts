import { containerStarter } from "~sidecar/containers/container-starter.js";
import type { ContainerizedResource } from "~sidecar/resources/interfaces.js";

export async function startTestContainer(
	/**
	 * Resource
	 */
	resource: ContainerizedResource,
) {
	const startedTestContainer =
		await containerStarter.startContainerForResource(resource);
	if (startedTestContainer === undefined) {
		throw new Error(`no container match for resource: ${resource.id}`);
	}
	return startedTestContainer;
}
