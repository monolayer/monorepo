import { cwd } from "node:process";
import path from "path";
import {
	assertBindMounts,
	assertContainerImage,
	assertExposedPorts,
} from "test/__setup__/assertions.js";
import { assert } from "vitest";
import { LocalStackContainer } from "~sidecar/containers/local-stack.js";
import { LocalStack } from "~sidecar/resources/local-stack.js";
import { test } from "~test/__setup__/container-test.js";

const localStackResource = new LocalStack("test-local-stack");

test(
	"Started container resource id label",
	{ sequential: true },
	async ({ containers }) => {
		const container = new LocalStackContainer(localStackResource);
		const startedContainer = await container.start();
		containers.push(startedContainer);

		const labels = startedContainer.getLabels();
		assert.strictEqual(
			labels["org.monolayer-sidecar.resource-id"],
			"test-local-stack",
		);
	},
);

test(
	"Bind mounts on a redis container",
	{ sequential: true },
	async ({ containers }) => {
		const container = new LocalStackContainer(localStackResource);
		const startedContainer = await container.start();
		containers.push(startedContainer);
		await assertBindMounts({
			resource: localStackResource,
			bindMounts: [
				`${path.join(cwd(), "tmp", "container-volumes", "local_stack", "test_local_stack_data")}:/var/lib/localstack:rw`,
			],
		});
	},
);

test("Exposed ports", { sequential: true }, async ({ containers }) => {
	const container = new LocalStackContainer(localStackResource);
	const startedContainer = await container.start();
	containers.push(startedContainer);
	await assertExposedPorts({
		container: startedContainer,
		ports: [4566],
	});
});

test("Gateway URL", { sequential: true }, async ({ containers }) => {
	const container = new LocalStackContainer(localStackResource);
	const startedContainer = await container.start();
	containers.push(startedContainer);

	assert.strictEqual(
		container.gatewayURL,
		`http://localhost:${startedContainer.getMappedPort(4566)}/`,
	);
});

test("LocalStack Custom image tag container", async ({ containers }) => {
	const localStackResource = new LocalStack("test-image-tag");

	const container = new LocalStackContainer(localStackResource, {
		containerImage: "localstack/localstack:3.8.1",
	});
	const startedContainer = await container.start();
	containers.push(startedContainer);
	await assertContainerImage({
		resource: localStackResource,
		expectedImage: "localstack/localstack:3.8.1",
	});
	await startedContainer.stop();
});
