import { assert } from "vitest";
import { assertExposedPorts } from "~test/__setup__/assertions.js";
import { test } from "~test/__setup__/container-test.js";
import { LocalStackContainer } from "~workloads/containers/local-stack.js";
import { Bucket } from "~workloads/workloads/stateful/bucket.js";

test(
	"Started container workload id label",
	{ sequential: true },
	async ({ containers }) => {
		const bucket = new Bucket("test-local-stack", () => true);
		const container = new LocalStackContainer(bucket);

		const startedContainer = await container.start();
		containers.push(startedContainer);

		const labels = startedContainer.getLabels();
		assert.strictEqual(
			labels["org.monolayer-workloads.workload-id"],
			"local-stack",
		);
	},
);

test(
	"Started container workload id label in test",
	{ sequential: true },
	async ({ containers }) => {
		const bucket = new Bucket("demo", () => true);
		const container = new LocalStackContainer(bucket, { test: true });
		const startedContainer = await container.start();
		containers.push(startedContainer);

		const labels = startedContainer.getLabels();
		assert.strictEqual(
			labels["org.monolayer-workloads.workload-id"],
			"local-stack-test",
		);
	},
);

test("Exposed ports", { sequential: true }, async ({ containers }) => {
	const bucket = new Bucket("test-local-stack", () => true);
	const container = new LocalStackContainer(bucket);
	const startedContainer = await container.start();
	containers.push(startedContainer);
	await assertExposedPorts({
		container: startedContainer,
		ports: [4566],
	});
});

test("Gateway URL", { sequential: true }, async ({ containers }) => {
	const bucket = new Bucket("test-local-stack", () => true);
	const container = new LocalStackContainer(bucket);
	const startedContainer = await container.start();
	containers.push(startedContainer);

	assert.strictEqual(
		container.gatewayURL,
		`http://localhost:${startedContainer.getMappedPort(4566)}/`,
	);
});
