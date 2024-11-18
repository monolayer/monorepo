import { createBucket } from "~sidecar/containers/admin/create-bucket.js";
import { LocalStackContainer } from "~sidecar/containers/local-stack.js";
import { LocalStack } from "~sidecar/workloads/stateful/local-stack.js";
import { assertBucket } from "~test/__setup__/assertions.js";
import { test } from "~test/__setup__/container-test.js";

test("create bucket", { sequential: true }, async ({ containers }) => {
	const localStackWorkload = new LocalStack("bucket-test");
	const localStackContainer = new LocalStackContainer(localStackWorkload);
	const startedContainer = await localStackContainer.start();
	containers.push(startedContainer);
	await createBucket("create-bucket-test", localStackContainer);
	await assertBucket("create-bucket-test", startedContainer);
});
