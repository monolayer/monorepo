import { cwd } from "node:process";
import path from "path";
import { createClient } from "redis";
import {
	assertBindMounts,
	assertContainerImage,
	assertExposedPorts,
} from "test/__setup__/assertions.js";
import { assert } from "vitest";
import { RedisContainer } from "~sidecar/containers/redis.js";
import { Redis } from "~sidecar/workloads/redis.js";
import { test } from "~test/__setup__/container-test.js";

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
		assert.strictEqual(
			labels["org.monolayer-sidecar.workload-id"],
			"test-redis-test",
		);
	},
);

test(
	"Bind mounts on a redis container",
	{ sequential: true },
	async ({ containers }) => {
		const container = new RedisContainer(redisStore);
		const startedContainer = await container.start();
		containers.push(startedContainer);
		await assertBindMounts({
			workload: redisStore,
			bindMounts: [
				`${path.join(cwd(), "tmp", "container-volumes", "redis", "test_redis_test_data")}:/data:rw`,
			],
		});
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
			ports: [6379, 8001],
		});
	},
);

test(
	"Assigned connection string to environment variable after start",
	{ sequential: true },
	async ({ containers }) => {
		delete process.env.SIDECAR_REDIS_TEST_REDIS_TEST_URL;
		const container = new RedisContainer(redisStore);
		const startedContainer = await container.start();
		containers.push(startedContainer);

		assert.strictEqual(
			process.env.SIDECAR_REDIS_TEST_REDIS_TEST_URL,
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

test("Web URL", { sequential: true }, async ({ containers }) => {
	const container = new RedisContainer(redisStore);
	const startedContainer = await container.start();
	containers.push(startedContainer);

	assert.strictEqual(
		container.webURL,
		`http://localhost:${startedContainer.getMappedPort(8001)}/`,
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

		const container = new RedisContainer(redisWorkload, {
			containerImage: "redis/redis-stack:7.2.0-v12",
		});
		const startedContainer = await container.start();
		containers.push(startedContainer);
		await assertContainerImage({
			workload: redisWorkload,
			expectedImage: "redis/redis-stack:7.2.0-v12",
		});
		await startedContainer.stop();
	},
);
