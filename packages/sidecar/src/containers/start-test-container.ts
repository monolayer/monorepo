import { containerStarter } from "~sidecar/containers/container-starter.js";
import { type GenericResource } from "~sidecar/resources/interfaces.js";

/**
 * Launches a test container for a resource.
 */
export async function startTestContainer(
	/**
	 * Resource to launch a test container.
	 */
	resource: GenericResource,
) {
	const startedTestContainer =
		await containerStarter.startContainerForResource(resource);
	if (startedTestContainer === undefined) {
		throw new Error(`no container match for resource: ${resource.id}`);
	}
	return startedTestContainer;
}
