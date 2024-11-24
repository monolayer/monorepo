import { createClient } from "redis";
import { assertExposedPorts } from "test/__setup__/assertions.js";
import { assert } from "vitest";
import { test } from "~test/__setup__/container-test.js";
import { RedisContainer } from "~workloads/containers/redis.js";
import { Redis } from "~workloads/workloads/stateful/redis.js";

const redisStore = new Redis("test-redis-test", (connectionStringEnvVar) =>
	createClient({
		url: process.env[connectionStringEnvVar],
	}).on("error", (err) => console.error("Redis Client Error", err)),
);

test(
	"Redis started container workload id label",
	{ sequential: true },
	async ({ containers }) => {
		const container = new RedisContainer(redisStore);
		const startedContainer = await container.start();
		containers.push(startedContainer);

		const labels = startedContainer.getLabels();
		console.dir(labels);
		assert.strictEqual(
			labels["org.monolayer-workloads.workload-id"],
			"redis-test-redis-test",
		);
	},
);

test(
	"Exposed ports of a redis container",
	{ sequential: true },
	async ({ containers }) => {
		const container = new RedisContainer(redisStore);
		const startedContainer = await container.start();
		containers.push(startedContainer);
		await assertExposedPorts({
			container: startedContainer,
			ports: [6379],
		});
	},
);

test(
	"Assigned connection string to environment variable after start",
	{ sequential: true },
	async ({ containers }) => {
		delete process.env.MONO_REDIS_TEST_REDIS_TEST_URL;
		const container = new RedisContainer(redisStore);
		const startedContainer = await container.start();
		containers.push(startedContainer);

		assert.strictEqual(
			process.env.MONO_REDIS_TEST_REDIS_TEST_URL,
			`redis://localhost:${startedContainer.getMappedPort(6379)}`,
		);
	},
);

test("Connection string URL", { sequential: true }, async ({ containers }) => {
	const container = new RedisContainer(redisStore);
	const startedContainer = await container.start();
	containers.push(startedContainer);

	assert.strictEqual(
		container.connectionURI,
		`redis://localhost:${startedContainer.getMappedPort(6379)}`,
	);
});
