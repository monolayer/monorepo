import {
	getContainerRuntimeClient,
	type StartedTestContainer,
} from "testcontainers";
import { assert } from "vitest";
import { CONTAINER_LABEL_NAME } from "~sidecar/containers/container.js";

export async function assertContainerImage({
	containerName,
	expectedImage,
}: {
	containerName: string;
	expectedImage: string;
}) {
	const containerRuntimeClient = await getContainerRuntimeClient();
	const existingContainer = await containerRuntimeClient.container.fetchByLabel(
		CONTAINER_LABEL_NAME,
		containerName,
	);

	assert(existingContainer, "Undefined container");
	const inspect = await existingContainer.inspect();

	assert.strictEqual(inspect.Config.Image, expectedImage);
}

export async function assertContainer({
	containerName,
}: {
	containerName: string;
}) {
	const containerRuntimeClient = await getContainerRuntimeClient();
	const existingContainer = await containerRuntimeClient.container.fetchByLabel(
		CONTAINER_LABEL_NAME,
		containerName,
	);

	assert(existingContainer, "Undefined container");
}

export async function assertBindMounts({
	containerName,
	bindMounts,
}: {
	containerName: string;
	bindMounts: string[];
}) {
	const containerRuntimeClient = await getContainerRuntimeClient();
	const existingContainer = await containerRuntimeClient.container.fetchByLabel(
		CONTAINER_LABEL_NAME,
		containerName,
	);

	assert(existingContainer, "Undefined container");
	const inspection = await existingContainer?.inspect();
	assert(inspection);
	assert.deepStrictEqual(inspection["HostConfig"]["Binds"], bindMounts);
}

export async function assertExposedPorts({
	container,
	ports,
}: {
	container: StartedTestContainer;
	ports: number[];
}) {
	for (const port of ports) {
		assert.doesNotThrow(() => container.getMappedPort(port));
	}
}
