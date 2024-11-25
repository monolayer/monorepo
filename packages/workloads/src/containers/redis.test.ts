import { Redis as IORedis } from "ioredis";
import { assertExposedPorts } from "test/__setup__/assertions.js";
import { assert } from "vitest";
import { test } from "~test/__setup__/container-test.js";
import { RedisContainer } from "~workloads/containers/redis.js";
import { Redis } from "~workloads/workloads/stateful/redis.js";

test("Redis container", { sequential: true }, async ({ containers }) => {
	const redisStore = new Redis(
		"test-redis-test",
		(connectionStringEnvVar) =>
			new IORedis(process.env[connectionStringEnvVar]!),
	);
	const container = new RedisContainer(redisStore);
	const startedContainer = await container.start();
	containers.push(startedContainer);

	const labels = startedContainer.getLabels();

	assert.strictEqual(
		labels["org.monolayer-workloads.workload-id"],
		"redis-test-redis-test",
	);
	await assertExposedPorts({
		container: startedContainer,
		ports: [6379],
	});

	assert.strictEqual(
		process.env.MONO_REDIS_TEST_REDIS_TEST_URL,
		`redis://localhost:${startedContainer.getMappedPort(6379)}`,
	);

	assert.strictEqual(
		container.connectionURI,
		`redis://localhost:${startedContainer.getMappedPort(6379)}`,
	);
});
