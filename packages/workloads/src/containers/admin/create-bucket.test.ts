import { assert } from "vitest";
import { createBucket } from "~sidecar/containers/admin/create-bucket.js";
import { getExistingContainer } from "~sidecar/containers/admin/introspection.js";
import { LocalStackContainer } from "~sidecar/containers/local-stack.js";
import { LocalStack } from "~sidecar/workloads/stateful/local-stack.js";
import { startContainer, test } from "~test/__setup__/container-test.js";

test("create bucket", { sequential: true }, async ({ containers }) => {
	const localStackWorkload = new LocalStack("bucket-test");
	const localStackContainer = new LocalStackContainer(localStackWorkload);

	await startContainer(localStackContainer);
	const container = await getExistingContainer(localStackWorkload);
	assert(container);
	containers.push(container);
	await createBucket("create-bucket-test", localStackContainer);
});
