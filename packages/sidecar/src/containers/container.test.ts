// import {
// 	assertBindMounts,
// 	assertExposedPorts,
// } from "test/__setup__/assertions.js";
// import { getContainerRuntimeClient } from "testcontainers";
// import { assert } from "vitest";
// import { Container } from "~sidecar/containers/container.js";
// import { test } from "~test/__setup__/container-test.js";

// test("start container", async ({ containers }) => {
// 	const container = new Container({
// 		resourceId: "one",
// 		name: "test-container",
// 		image: "nginx:latest",
// 	});
// 	const startedContainer = await container.start();

// 	containers.push(startedContainer);

// 	const labels = startedContainer.getLabels();
// 	assert.strictEqual(labels["org.monolayer-sidecar.name"], container.name);
// });

// test("start container and expose ports", async ({ containers }) => {
// 	const container = new Container({
// 		resourceId: "one",
// 		name: "test-container-ports",
// 		image: "nginx:latest",
// 		portsToExpose: [80],
// 	});
// 	const startedContainer = await container.start();
// 	containers.push(startedContainer);

// 	await assertExposedPorts({ container: startedContainer, ports: [80] });
// });

// test("start container with persistence volumes", async ({ containers }) => {
// 	const container = new Container({
// 		resourceId: "one",
// 		name: "test-container-persistence",
// 		image: "nginx:latest",
// 		portsToExpose: [80],
// 		persistenceVolumesTargets: ["/var/www"],
// 	});
// 	const startedContainer = await container.start({
// 		persistenceVolumes: true,
// 	});
// 	containers.push(startedContainer);

// 	await assertBindMounts({
// 		containerName: container.name,
// 		bindMounts: ["/tmp/www:/var/www:rw"],
// 	});
// });

// test("start container with reuse", async ({ containers }) => {
// 	const container = new Container({
// 		resourceId: "one",
// 		name: "test-container-reuse",
// 		image: "nginx:latest",
// 	});
// 	const startedContainer = await container.start({ reuse: true });
// 	containers.push(startedContainer);

// 	const anotherContainer = new Container({
// 		resourceId: "one",
// 		name: "test-container-reuse",
// 		image: "nginx:latest",
// 	});

// 	const anotherStartedContainer = await anotherContainer.start({
// 		reuse: true,
// 	});

// 	assert.strictEqual(startedContainer.getId(), anotherStartedContainer.getId());
// });

// test("mapped ports", async ({ containers }) => {
// 	const container = new Container({
// 		resourceId: "one",
// 		name: "test-container",
// 		image: "nginx:latest",
// 		portsToExpose: [80],
// 	});
// 	const startedContainer = await container.start();
// 	containers.push(startedContainer);

// 	assert.deepStrictEqual(container.mappedPorts, [
// 		{
// 			container: 80,
// 			host: startedContainer.getMappedPort(80),
// 		},
// 	]);
// });

// test("without mapped ports", async ({ containers }) => {
// 	const container = new Container({
// 		resourceId: "one",
// 		name: "test-container-wo-mapped-ports",
// 		image: "nginx:latest",
// 	});
// 	const startedContainer = await container.start();
// 	containers.push(startedContainer);

// 	assert.deepStrictEqual(container.mappedPorts, []);
// });

// test("mapped ports not started container", async ({ containers }) => {
// 	const container = new Container({
// 		resourceId: "one",
// 		name: "test-container-wo-mapped-ports",
// 		image: "nginx:latest",
// 	});
// 	const startedContainer = await container.start();
// 	containers.push(startedContainer);

// 	assert.deepStrictEqual(container.mappedPorts, []);
// });

// test("stop container", async () => {
// 	const container = new Container({
// 		resourceId: "one",
// 		name: "test-container-stop",
// 		image: "nginx:latest",
// 		portsToExpose: [80],
// 	});
// 	await container.start();
// 	await container.stop();

// 	const containerRuntimeClient = await getContainerRuntimeClient();
// 	const existingContainer = await containerRuntimeClient.container.fetchByLabel(
// 		"org.monolayer-sidecar.name",
// 		"test-container-stop",
// 	);

// 	assert.isUndefined(existingContainer);
// });

// test("start container with reuse", async ({ containers }) => {
// 	const container = new Container({
// 		resourceId: "one",
// 		name: "test-container-reuse",
// 		image: "nginx:latest",
// 	});
// 	const startedContainer = await container.start({ reuse: true });
// 	containers.push(startedContainer);

// 	const anotherContainer = new Container({
// 		resourceId: "one",
// 		name: "test-container-reuse",
// 		image: "nginx:latest",
// 	});

// 	const anotherStartedContainer = await anotherContainer.start({
// 		reuse: true,
// 	});

// 	assert.strictEqual(startedContainer.getId(), anotherStartedContainer.getId());
// });

// test("mapped ports", async ({ containers }) => {
// 	const container = new Container({
// 		resourceId: "one",
// 		name: "test-container",
// 		image: "nginx:latest",
// 		portsToExpose: [80],
// 	});
// 	const startedContainer = await container.start();
// 	containers.push(startedContainer);

// 	assert.deepStrictEqual(container.mappedPorts, [
// 		{
// 			container: 80,
// 			host: startedContainer.getMappedPort(80),
// 		},
// 	]);
// });

// test("without mapped ports", async ({ containers }) => {
// 	const container = new Container({
// 		resourceId: "one",
// 		name: "test-container-wo-mapped-ports",
// 		image: "nginx:latest",
// 	});

// 	const startedContainer = await container.start();
// 	containers.push(startedContainer);

// 	assert.deepStrictEqual(container.mappedPorts, []);
// });

// test("stop container", async () => {
// 	const container = new Container({
// 		resourceId: "one",
// 		name: "test-container-stop",
// 		image: "nginx:latest",
// 		portsToExpose: [80],
// 	});

// 	await container.start();
// 	await container.stop();

// 	const containerRuntimeClient = await getContainerRuntimeClient();
// 	const existingContainer = await containerRuntimeClient.container.fetchByLabel(
// 		"org.monolayer-sidecar.name",
// 		"test-container-stop",
// 	);

// 	assert.isUndefined(existingContainer);
// });

// test("start multiple times returns the same container", async ({
// 	containers,
// }) => {
// 	const container = new Container({
// 		resourceId: "one",
// 		name: "test-container-started",
// 		image: "nginx:latest",
// 		portsToExpose: [80],
// 	});
// 	const container1 = await container.start();
// 	const container2 = await container.start();
// 	containers.push(container1, container2);

// 	assert.strictEqual(container1.getId, container2.getId);
// });
