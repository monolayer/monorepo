import { kebabCase } from "case-anything";
import { cwd } from "node:process";
import path from "path";
import {
	assertBindMounts,
	assertContainer,
	assertContainerImage,
	assertExposedPorts,
} from "test/__setup__/assertions.js";
import { assert } from "vitest";
import { LocalStackContainer } from "~sidecar/containers/local-stack.js";
import { LocalStack } from "~sidecar/resources/local-stack.js";
import { test } from "~test/__setup__/container-test.js";

const localStackResource = new LocalStack("test-local-stack");

test(
	"Started container name label",
	{ sequential: true, retry: 2 },
	async ({ containers }) => {
		const container = new LocalStackContainer(localStackResource);
		const startedContainer = await container.start();
		containers.push(startedContainer);

		const labels = startedContainer.getLabels();
		assert.strictEqual(labels["org.monolayer-sidecar.name"], container.name);
		await assertContainer({ containerName: container.name });
	},
);

test(
	"Started container resource id label",
	{ sequential: true, retry: 2 },
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
	{ sequential: true, retry: 2 },
	async ({ containers }) => {
		const container = new LocalStackContainer(localStackResource);
		const startedContainer = await container.start();
		containers.push(startedContainer);
		await assertBindMounts({
			containerName: container.name,
			bindMounts: [
				`${path.join(cwd(), "tmp", "container-volumes", kebabCase(`${container.name}-data`))}:/var/lib/localstack:rw`,
			],
		});
	},
);

test(
	"Exposed ports",
	{ sequential: true, retry: 2 },
	async ({ containers }) => {
		const container = new LocalStackContainer(localStackResource);
		const startedContainer = await container.start();
		containers.push(startedContainer);
		await assertExposedPorts({
			container: startedContainer,
			ports: [4566],
		});
	},
);

test("Gateway URL", { sequential: true, retry: 2 }, async ({ containers }) => {
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

	localStackResource.containerImageTag = "3.8.1";

	const container = new LocalStackContainer(localStackResource);
	const startedContainer = await container.start();
	containers.push(startedContainer);
	await assertContainerImage({
		containerName: container.name,
		expectedImage: "localstack/localstack:3.8.1",
	});
	await startedContainer.stop();
});
