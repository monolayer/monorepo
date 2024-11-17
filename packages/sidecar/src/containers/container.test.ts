import path from "node:path";
import { cwd } from "process";
import {
	assertBindMounts,
	assertExposedPorts,
} from "test/__setup__/assertions.js";
import { getContainerRuntimeClient } from "testcontainers";
import { assert } from "vitest";
import { Container } from "~sidecar/containers/container.js";
import { test } from "~test/__setup__/container-test.js";

class TestResource {
	id: string;
	constructor(id: string) {
		this.id = id;
	}
}
const testResource = new TestResource("container-test");

const nginxSpec = {
	containerImage: "nginx:latest",
	portsToExpose: [80],
	environment: {},
	persistentVolumeTargets: ["/var/www"],
};

test("start container", async ({ containers }) => {
	const container = new Container({
		resource: testResource,
		containerSpec: nginxSpec,
	});
	const startedContainer = await container.start();

	containers.push(startedContainer);
});

test("start container and expose ports", async ({ containers }) => {
	const container = new Container({
		resource: testResource,
		containerSpec: nginxSpec,
	});
	const startedContainer = await container.start();
	containers.push(startedContainer);

	await assertExposedPorts({ container: startedContainer, ports: [80] });
});

test("start container with persistence volumes", async ({ containers }) => {
	const container = new Container({
		resource: testResource,
		containerSpec: nginxSpec,
	});
	const startedContainer = await container.start({
		persistenceVolumes: true,
	});
	containers.push(startedContainer);

	await assertBindMounts({
		resource: testResource,
		bindMounts: [
			`${path.join(cwd(), "tmp/container-volumes", "test_resource", "container_test_data")}:/var/www:rw`,
		],
	});
});

test("start container with reuse", async ({ containers }) => {
	const container = new Container({
		resource: testResource,
		containerSpec: nginxSpec,
	});
	const startedContainer = await container.start({ reuse: true });
	containers.push(startedContainer);

	const anotherContainer = new Container({
		resource: testResource,
		containerSpec: nginxSpec,
	});

	const anotherStartedContainer = await anotherContainer.start({
		reuse: true,
	});

	assert.strictEqual(startedContainer.getId(), anotherStartedContainer.getId());
});

test("mapped ports", async ({ containers }) => {
	const container = new Container({
		resource: testResource,
		containerSpec: nginxSpec,
	});
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
	const container = new Container({
		resource: testResource,
		containerSpec: {
			...nginxSpec,
			portsToExpose: [],
		},
	});
	const startedContainer = await container.start();
	containers.push(startedContainer);

	assert.deepStrictEqual(container.mappedPorts, []);
});

test("mapped ports not started container", async () => {
	const container = new Container({
		resource: testResource,
		containerSpec: nginxSpec,
	});
	assert.isUndefined(container.mappedPorts);
});

test("stop container", async () => {
	const container = new Container({
		resource: testResource,
		containerSpec: nginxSpec,
	});
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
	const container = new Container({
		resource: testResource,
		containerSpec: nginxSpec,
	});
	const container1 = await container.start();
	const container2 = await container.start();
	containers.push(container1, container2);

	assert.strictEqual(container1.getId, container2.getId);
});
