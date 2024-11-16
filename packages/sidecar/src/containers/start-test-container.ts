import { containerStarter } from "~sidecar/containers/container-starter.js";
import { type GenericResource } from "~sidecar/resources/interfaces.js";

export async function startTestContainer(
	/**
	 * Resource
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
