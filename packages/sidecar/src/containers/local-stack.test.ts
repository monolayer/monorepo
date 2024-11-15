import { cwd } from "node:process";
import path from "path";
import {
	assertBindMounts,
	assertContainer,
	assertContainerImage,
	assertExposedPorts,
} from "test/__setup__/assertions.js";
import { type StartedTestContainer } from "testcontainers";
import { afterAll, assert, test } from "vitest";
import { LocalStackContainer } from "~sidecar/containers/local-stack.js";
import { LocalStack } from "~sidecar/resources/local-stack.js";

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

const localStackResource = new LocalStack("test-local-stack");

test("Started container name label", { sequential: true }, async () => {
	process.env.DEBUG = "testcontainers*";
	const container = new LocalStackContainer(
		localStackResource,
		"test-container-name",
	);
	const startedContainer = await container.start();
	testContainers.push(startedContainer);

	const labels = startedContainer.getLabels();
	assert.strictEqual(
		labels["org.monolayer-sidecar.name"],
		"local_stack_test_container_name",
	);
	await assertContainer({ containerName: "local_stack_test_container_name" });
});

test("Started container resource id label", { sequential: true }, async () => {
	const container = new LocalStackContainer(
		localStackResource,
		"test-container-name",
	);
	const startedContainer = await container.start();
	testContainers.push(startedContainer);

	const labels = startedContainer.getLabels();
	assert.strictEqual(
		labels["org.monolayer-sidecar.resource-id"],
		"test-local-stack",
	);
});

test("Bind mounts on a redis container", { sequential: true }, async () => {
	const container = new LocalStackContainer(
		localStackResource,
		"test-container-bind-mounts",
	);
	const startedContainer = await container.start();
	testContainers.push(startedContainer);
	await assertBindMounts({
		containerName: "local_stack_test_container_bind_mounts",
		bindMounts: [
			`${path.join(cwd(), "tmp", "container-volumes/test-container-bind-mounts-data")}:/var/lib/localstack:rw`,
		],
	});
});

test("Exposed ports", { sequential: true }, async () => {
	const container = new LocalStackContainer(
		localStackResource,
		"test-container-ports",
	);
	const startedContainer = await container.start();
	testContainers.push(startedContainer);
	await assertExposedPorts({
		container: startedContainer,
		ports: [4566],
	});
});

test("Gateway URL", { sequential: true }, async () => {
	const container = new LocalStackContainer(
		localStackResource,
		"test-container-gateway",
	);
	const startedContainer = await container.start();
	testContainers.push(startedContainer);

	assert.strictEqual(
		container.gatewayURL,
		`http://localhost:${startedContainer.getMappedPort(4566)}/`,
	);
});

test("LocalStack Custom image tag container", async () => {
	const localStackResource = new LocalStack("test-image-tag");

	localStackResource.containerImageTag = "3.8.1";

	const container = new LocalStackContainer(
		localStackResource,
		"test-image-tag-test",
	);
	const startedContainer = await container.start();
	assert(startedContainer);
	await assertContainerImage({
		containerName: "local_stack_test_image_tag_test",
		expectedImage: "localstack/localstack:3.8.1",
	});
	await startedContainer.stop();
});
