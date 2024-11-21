import { createClient } from "redis";
import {
	assertContainerImage,
	assertExposedPorts,
} from "test/__setup__/assertions.js";
import { assert } from "vitest";
import { startContainer, test } from "~test/__setup__/container-test.js";
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
		const startedContainer = await startContainer(container);
		containers.push(startedContainer);

		const labels = startedContainer.getLabels();
		assert.strictEqual(
			labels["org.monolayer-sidecar.workload-id"],
			"redis-test-redis-test",
		);
	},
);

test(
	"Exposed ports of a redis container",
	{ sequential: true },
	async ({ containers }) => {
		const container = new RedisContainer(redisStore);
		const startedContainer = await startContainer(container);
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
		const startedContainer = await startContainer(container);
		containers.push(startedContainer);

		assert.strictEqual(
			process.env.MONO_REDIS_TEST_REDIS_TEST_URL,
			`redis://localhost:${startedContainer.getMappedPort(6379)}`,
		);
	},
);

test("Connection string URL", { sequential: true }, async ({ containers }) => {
	const container = new RedisContainer(redisStore);
	const startedContainer = await startContainer(container);
	containers.push(startedContainer);

	assert.strictEqual(
		container.connectionURI,
		`redis://localhost:${startedContainer.getMappedPort(6379)}`,
	);
});

test(
	"Redis with custom image tag container",
	{ sequential: true },
	async ({ containers }) => {
		const redisWorkload = new Redis(
			"rd-custom-image-tag",
			(connectionStringEnvVar) =>
				createClient({
					url: process.env[connectionStringEnvVar],
				}).on("error", (err) => console.error("Redis Client Error", err)),
		);

		redisWorkload.containerOptions({
			imageName: "redis/redis-stack:7.2.0-v12",
		});

		const container = new RedisContainer(redisWorkload);
		const startedContainer = await startContainer(container);
		containers.push(startedContainer);
		await assertContainerImage({
			workload: redisWorkload,
			expectedImage: "redis/redis-stack:7.2.0-v12",
		});
		await startedContainer.stop();
	},
);
