import { assert } from "vitest";
import { test } from "~test/__setup__/container-test.js";
import { MinioContainer } from "~workloads/containers/minio.js";
import { Bucket } from "~workloads/workloads/stateful/bucket.js";

test(
	"Started container",
	{ sequential: true, timeout: 30000 },
	async ({ containers }) => {
		const bucket = new Bucket("test-minio");
		const container = new MinioContainer(bucket);

		const startedContainer = await container.start(true);
		containers.push(startedContainer);

		assert.strictEqual(
			container.gatewayURL,
			`http://localhost:${startedContainer.getMappedPort(9000)}/`,
		);

		assert.strictEqual(
			new MinioContainer(bucket).qualifiedWorkloadId(),
			"minio",
		);

		const labels = startedContainer.getLabels();
		assert.strictEqual(labels["org.monolayer-workloads.workload-id"], "minio");

		container.mode = "test";
		assert.strictEqual(
			new MinioContainer(bucket, { test: true }).qualifiedWorkloadId(),
			"minio-test",
		);
	},
);
