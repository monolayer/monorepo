import {
	assertContainerImage,
	assertExposedPorts,
} from "test/__setup__/assertions.js";
import { assert } from "vitest";
import { LocalStackContainer } from "~sidecar/containers/local-stack.js";
import { LocalStack } from "~sidecar/workloads/stateful/local-stack.js";
import { test } from "~test/__setup__/container-test.js";

const localStackWorkload = new LocalStack("test-local-stack");

test(
	"Started container workload id label",
	{ sequential: true },
	async ({ containers }) => {
		const container = new LocalStackContainer(localStackWorkload);
		const startedContainer = await container.start();
		containers.push(startedContainer);

		const labels = startedContainer.getLabels();
		assert.strictEqual(
			labels["org.monolayer-sidecar.workload-id"],
			"test-local-stack",
		);
	},
);

test("Exposed ports", { sequential: true }, async ({ containers }) => {
	const container = new LocalStackContainer(localStackWorkload);
	const startedContainer = await container.start();
	containers.push(startedContainer);
	await assertExposedPorts({
		container: startedContainer,
		ports: [4566],
	});
});

test("Gateway URL", { sequential: true }, async ({ containers }) => {
	const container = new LocalStackContainer(localStackWorkload);
	const startedContainer = await container.start();
	containers.push(startedContainer);

	assert.strictEqual(
		container.gatewayURL,
		`http://localhost:${startedContainer.getMappedPort(4566)}/`,
	);
});

test("LocalStack Custom image tag container", async ({ containers }) => {
	const localStackWorkload = new LocalStack("test-image-tag");

	const container = new LocalStackContainer(localStackWorkload, {
		containerImage: "localstack/localstack:3.8.1",
	});
	const startedContainer = await container.start();
	containers.push(startedContainer);
	await assertContainerImage({
		workload: localStackWorkload,
		expectedImage: "localstack/localstack:3.8.1",
	});
	await startedContainer.stop();
});
