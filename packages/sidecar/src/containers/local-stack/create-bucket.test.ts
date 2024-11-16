import { LocalStackContainer } from "~sidecar/containers/local-stack.js";
import { createBucket } from "~sidecar/containers/local-stack/create-bucket.js";
import { LocalStack } from "~sidecar/resources/local-stack.js";
import { assertBucket } from "~test/__setup__/assertions.js";
import { test } from "~test/__setup__/container-test.js";

test(
	"create bucket",
	{ sequential: true, retry: 2 },
	async ({ containers }) => {
		const localStackResource = new LocalStack("bucket-test");
		const localStackContainer = new LocalStackContainer(localStackResource);
		const startedContainer = await localStackContainer.start();
		containers.push(startedContainer);
		await createBucket("create-bucket-test", localStackContainer);
		await assertBucket("create-bucket-test", localStackContainer);
	},
);
