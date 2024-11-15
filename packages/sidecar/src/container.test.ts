import {
	assertBindMounts,
	assertExposedPorts,
} from "test/__setup__/assertions.js";
import {
	getContainerRuntimeClient,
	type StartedTestContainer,
} from "testcontainers";
import { afterAll, assert, test } from "vitest";
import { Container } from "~sidecar/container.js";

const testContainers: StartedTestContainer[] = [];

afterAll(async () => {
	for (const container of testContainers) {
		try {
			await container.stop();
		} catch {
			//
		}
	}
});

test("start container", async () => {
	const container = new Container({
		resourceId: "one",
		name: "test-container",
		image: {
			name: "nginx",
			tag: "latest",
		},
	});
	const startedContainer = await container.start();
	testContainers.push(startedContainer);

	const labels = startedContainer.getLabels();
	assert.strictEqual(labels["org.monolayer-sidecar.name"], "test-container");
});

test("start container and expose ports", async () => {
	const container = new Container({
		resourceId: "one",
		name: "test-container-ports",
		image: {
			name: "nginx",
			tag: "latest",
		},
		portsToExpose: [80],
	});
	const startedContainer = await container.start();
	testContainers.push(startedContainer);

	await assertExposedPorts({ container: startedContainer, ports: [80] });
});

test("start container with persistence volumes", async () => {
	const container = new Container({
		resourceId: "one",
		name: "test-container-persistence",
		image: {
			name: "nginx",
			tag: "latest",
		},
		portsToExpose: [80],
		persistenceVolumes: [{ source: "/tmp/www", target: "/var/www" }],
	});
	const startedContainer = await container.start({
		persistenceVolumes: true,
	});

	testContainers.push(startedContainer);

	await assertBindMounts({
		containerName: "test-container-persistence",
		bindMounts: ["/tmp/www:/var/www:rw"],
	});
});

test("start container with reuse", async () => {
	const container = new Container({
		resourceId: "one",
		name: "test-container-reuse",
		image: {
			name: "nginx",
			tag: "latest",
		},
	});
	const startedContainer = await container.start({ reuse: true });
	testContainers.push(startedContainer);

	const anotherContainer = new Container({
		resourceId: "one",
		name: "test-container-reuse",
		image: {
			name: "nginx",
			tag: "latest",
		},
	});

	const anotherStartedContainer = await anotherContainer.start({
		reuse: true,
	});
	testContainers.push(anotherStartedContainer);

	assert.strictEqual(startedContainer.getId(), anotherStartedContainer.getId());
});

test("mapped ports", async () => {
	const container = new Container({
		resourceId: "one",
		name: "test-container",
		image: {
			name: "nginx",
			tag: "latest",
		},
		portsToExpose: [80],
	});
	const startedContainer = await container.start();
	testContainers.push(startedContainer);

	assert.deepStrictEqual(container.mappedPorts, [
		{
			container: 80,
			host: startedContainer.getMappedPort(80),
		},
	]);
});

test("without mapped ports", async () => {
	const container = new Container({
		resourceId: "one",
		name: "test-container-wo-mapped-ports",
		image: {
			name: "nginx",
			tag: "latest",
		},
	});
	const startedContainer = await container.start();
	testContainers.push(startedContainer);

	assert.deepStrictEqual(container.mappedPorts, []);
});

test("mapped ports not started container", async () => {
	const container = new Container({
		resourceId: "one",
		name: "test-container-wo-mapped-ports",
		image: {
			name: "nginx",
			tag: "latest",
		},
	});
	assert.isUndefined(container.mappedPorts);
});

test("stop container", async () => {
	const container = new Container({
		resourceId: "one",
		name: "test-container-stop",
		image: {
			name: "nginx",
			tag: "latest",
		},
		portsToExpose: [80],
	});
	const startedContainer = await container.start();
	testContainers.push(startedContainer);

	await container.stop();

	const containerRuntimeClient = await getContainerRuntimeClient();
	const existingContainer = await containerRuntimeClient.container.fetchByLabel(
		"org.monolayer-sidecar.name",
		"test-container-stop",
	);

	assert.isUndefined(existingContainer);
});

test("start container with reuse", async () => {
	const container = new Container({
		resourceId: "one",
		name: "test-container-reuse",
		image: {
			name: "nginx",
			tag: "latest",
		},
	});
	const startedContainer = await container.start({ reuse: true });
	testContainers.push(startedContainer);

	const anotherContainer = new Container({
		resourceId: "one",
		name: "test-container-reuse",
		image: {
			name: "nginx",
			tag: "latest",
		},
	});

	const anotherStartedContainer = await anotherContainer.start({
		reuse: true,
	});
	testContainers.push(anotherStartedContainer);

	assert.strictEqual(startedContainer.getId(), anotherStartedContainer.getId());
});

test("mapped ports", async () => {
	const container = new Container({
		resourceId: "one",
		name: "test-container",
		image: {
			name: "nginx",
			tag: "latest",
		},
		portsToExpose: [80],
	});
	const startedContainer = await container.start();
	testContainers.push(startedContainer);

	assert.deepStrictEqual(container.mappedPorts, [
		{
			container: 80,
			host: startedContainer.getMappedPort(80),
		},
	]);
});

test("without mapped ports", async () => {
	const container = new Container({
		resourceId: "one",
		name: "test-container-wo-mapped-ports",
		image: {
			name: "nginx",
			tag: "latest",
		},
	});
	const startedContainer = await container.start();
	testContainers.push(startedContainer);

	assert.deepStrictEqual(container.mappedPorts, []);
});

test("stop container", async () => {
	const container = new Container({
		resourceId: "one",
		name: "test-container-stop",
		image: {
			name: "nginx",
			tag: "latest",
		},
		portsToExpose: [80],
	});
	const startedContainer = await container.start();
	testContainers.push(startedContainer);

	await container.stop();

	const containerRuntimeClient = await getContainerRuntimeClient();
	const existingContainer = await containerRuntimeClient.container.fetchByLabel(
		"org.monolayer-sidecar.name",
		"test-container-stop",
	);

	assert.isUndefined(existingContainer);
});

test("start multiple times returns the same container", async () => {
	const container = new Container({
		resourceId: "one",
		name: "test-container-started",
		image: {
			name: "nginx",
			tag: "latest",
		},
		portsToExpose: [80],
	});
	const container1 = await container.start();
	const container2 = await container.start();

	assert.strictEqual(container1.getId, container2.getId);
});
