import { assertExposedPorts } from "test/__setup__/assertions.js";
import { getContainerRuntimeClient } from "testcontainers";
import { assert } from "vitest";
import { WorkloadContainer } from "~sidecar/containers/container.js";
import { startContainer, test } from "~test/__setup__/container-test.js";

class TestWorkload {
	id: string;
	constructor(id: string) {
		this.id = id;
	}
	stateful = true;
}
const testWorkload = new TestWorkload("container-test");

const nginxSpec = {
	containerImage: "nginx:latest",
	portsToExpose: [80],
	environment: {},
};

test("start container", async ({ containers }) => {
	const container = new WorkloadContainer(testWorkload, nginxSpec);
	const startedContainer = await startContainer(container);

	containers.push(startedContainer);
});

test("start container and expose ports", async ({ containers }) => {
	const container = new WorkloadContainer(testWorkload, nginxSpec);
	const startedContainer = await startContainer(container);
	containers.push(startedContainer);

	await assertExposedPorts({ container: startedContainer, ports: [80] });
});

test("start container with reuse", async ({ containers }) => {
	const container = new WorkloadContainer(testWorkload, nginxSpec);
	const startedContainer = await container.start({
		reuse: true,
		publishToRandomPorts: true,
	});
	containers.push(startedContainer);
	const anotherContainer = new WorkloadContainer(testWorkload, nginxSpec);

	const anotherStartedContainer = await anotherContainer.start({
		reuse: true,
		publishToRandomPorts: true,
	});

	assert.strictEqual(startedContainer.getId(), anotherStartedContainer.getId());
});

test("mapped ports", async ({ containers }) => {
	const container = new WorkloadContainer(testWorkload, nginxSpec);
	const startedContainer = await startContainer(container);
	containers.push(startedContainer);

	assert.deepStrictEqual(container.mappedPorts, [
		{
			container: 80,
			host: startedContainer.getMappedPort(80),
		},
	]);
});

test("without mapped ports", async ({ containers }) => {
	const container = new WorkloadContainer(testWorkload, {
		...nginxSpec,
		portsToExpose: [],
	});
	const startedContainer = await startContainer(container);
	containers.push(startedContainer);

	assert.deepStrictEqual(container.mappedPorts, []);
});

test("mapped ports not started container", async () => {
	const container = new WorkloadContainer(testWorkload, nginxSpec);
	assert.isUndefined(container.mappedPorts);
});

test("stop container", async () => {
	const container = new WorkloadContainer(testWorkload, nginxSpec);
	await startContainer(container);
	await container.stop();

	const containerRuntimeClient = await getContainerRuntimeClient();
	const existingContainer = await containerRuntimeClient.container.fetchByLabel(
		"org.monolayer-sidecar.name",
		"test-container-stop",
	);

	assert.isUndefined(existingContainer);
});

test("start multiple times returns the same container", async ({
	containers,
}) => {
	const container = new WorkloadContainer(testWorkload, nginxSpec);
	const container1 = await startContainer(container);
	const container2 = await startContainer(container);
	containers.push(container1, container2);

	assert.strictEqual(container1.getId, container2.getId);
});
