import { assert, test } from "vitest";
import { startTestContainer } from "~sidecar/containers/start-test-container.js";
import { LocalStack } from "~sidecar/resources/local-stack.js";
import { assertContainerImage } from "~test/__setup__/assertions.js";

test("LocalStack Custom image tag container", async () => {
	const redisResource = new LocalStack("test-image-tag");

	redisResource.containerImageTag = "3.8.1";
	const startedContainer = await startTestContainer(redisResource);
	assert(startedContainer);
	await assertContainerImage({
		containerName: "local_stack_test_image_tag_test",
		expectedImage: "localstack/localstack:3.8.1",
	});
	await startedContainer.stop();
});
