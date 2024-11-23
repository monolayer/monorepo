import { assertExposedPorts } from "test/__setup__/assertions.js";
import { getContainerRuntimeClient } from "testcontainers";
import { assert } from "vitest";
import { test } from "~test/__setup__/container-test.js";
import {
	WorkloadContainer,
	type WorkloadContainerDefinition,
} from "~workloads/containers/container.js";
import { StatefulWorkload } from "~workloads/workloads/stateful/stateful-workload.js";

class TestWorkload extends StatefulWorkload {}
const testWorkload = new TestWorkload("container-test");

class WorkloadTestContainer extends WorkloadContainer {
	definition: WorkloadContainerDefinition = {
		containerImage: "nginx:latest",
		portsToExpose: [80],
		environment: {},
	};
}

test("start container", async ({ containers }) => {
	const container = new WorkloadTestContainer(testWorkload);
	const startedContainer = await container.start();
	containers.push(startedContainer);
});

test("start container and expose ports", async ({ containers }) => {
	const container = new WorkloadTestContainer(testWorkload);
	const startedContainer = await container.start();
	containers.push(startedContainer);

	await assertExposedPorts({ container: startedContainer, ports: [80] });
});

test("start container with reuse", async ({ containers }) => {
	const container = new WorkloadTestContainer(testWorkload);
	const startedContainer = await container.start();
	containers.push(startedContainer);
	const anotherContainer = new WorkloadTestContainer(testWorkload);

	const anotherStartedContainer = await anotherContainer.start();

	assert.strictEqual(startedContainer.getId(), anotherStartedContainer.getId());
});

test("mapped ports", async ({ containers }) => {
	const container = new WorkloadTestContainer(testWorkload);
	const startedContainer = await container.start();
	containers.push(startedContainer);

	assert.deepStrictEqual(container.mappedPorts, [
		{
			container: 80,
			host: startedContainer.getMappedPort(80),
		},
	]);
});

test("without mapped ports", async ({ containers }) => {
	const container = new WorkloadTestContainer(testWorkload);
	container.definition = {
		...container.definition,
		portsToExpose: [],
	};
	const startedContainer = await container.start();
	containers.push(startedContainer);

	assert.deepStrictEqual(container.mappedPorts, []);
});

test("mapped ports not started container", async () => {
	const container = new WorkloadTestContainer(testWorkload);
	assert.isUndefined(container.mappedPorts);
});

test("stop container", async () => {
	const container = new WorkloadTestContainer(testWorkload);
	await container.start();
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
	const container = new WorkloadTestContainer(testWorkload);
	const container1 = await container.start();
	const container2 = await container.start();
	containers.push(container1, container2);

	assert.strictEqual(container1.getId, container2.getId);
});
