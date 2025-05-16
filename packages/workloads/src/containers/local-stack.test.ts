import { assert } from "vitest";
import { test } from "~test/__setup__/container-test.js";
import { LocalStackContainer } from "~workloads/containers/local-stack.js";
import { Bucket } from "~workloads/workloads/stateful/bucket.js";

test(
	"Started container",
	{ sequential: true, timeout: 30000 },
	async ({ containers }) => {
		const bucket = new Bucket("test-local-stack");
		const container = new LocalStackContainer(bucket);

		const startedContainer = await container.start(true);
		containers.push(startedContainer);

		assert.strictEqual(
			container.gatewayURL,
			`http://localhost:${startedContainer.getMappedPort(4566)}/`,
		);

		assert.strictEqual(
			new LocalStackContainer(bucket).qualifiedWorkloadId(),
			"local-stack",
		);

		const labels = startedContainer.getLabels();
		assert.strictEqual(
			labels["org.monolayer-workloads.workload-id"],
			"local-stack",
		);

		container.mode = "test";
		assert.strictEqual(
			new LocalStackContainer(bucket, { test: true }).qualifiedWorkloadId(),
			"local-stack-test",
		);
	},
);
