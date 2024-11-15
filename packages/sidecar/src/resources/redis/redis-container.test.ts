import { cwd } from "node:process";
import path from "path";
import { createClient } from "redis";
import {
	assertBindMounts,
	assertContainer,
	assertExposedPorts,
} from "test/__setup__/assertions.js";
import { type StartedTestContainer } from "testcontainers";
import { afterAll, assert, test } from "vitest";
import { RedisContainer } from "~sidecar/resources/redis/redis-container.js";
import { Redis } from "~sidecar/resources/redis/redis.js";

const testContainers: StartedTestContainer[] = [];

afterAll(async () => {
	for (const container of testContainers) {
		try {
			await container.stop();
		} catch {
			//
		}
	}
});

const redisStore = new Redis("test-redis-test", (connectionStringEnvVar) =>
	createClient({
		url: process.env[connectionStringEnvVar],
	}).on("error", (err) => console.error("Redis Client Error", err)),
);

test("Redis started container name label", { sequential: true }, async () => {
	const container = new RedisContainer(redisStore, "test-container-name");
	const startedContainer = await container.start();
	testContainers.push(startedContainer);

	const labels = startedContainer.getLabels();
	assert.strictEqual(
		labels["org.monolayer-sidecar.name"],
		"redis_test_container_name",
	);
	await assertContainer({ containerName: "redis_test_container_name" });
});

test(
	"Redis started container resource id label",
	{ sequential: true },
	async () => {
		const container = new RedisContainer(redisStore, "test-container-name");
		const startedContainer = await container.start();
		testContainers.push(startedContainer);

		const labels = startedContainer.getLabels();
		assert.strictEqual(
			labels["org.monolayer-sidecar.resource-id"],
			"test-redis-test",
		);
		await assertContainer({ containerName: "redis_test_container_name" });
	},
);

test("Bind mounts on a redis container", { sequential: true }, async () => {
	const container = new RedisContainer(
		redisStore,
		"test-container-bind-mounts",
	);
	const startedContainer = await container.start();
	testContainers.push(startedContainer);
	await assertBindMounts({
		containerName: "redis_test_container_bind_mounts",
		bindMounts: [
			`${path.join(cwd(), "tmp", "container-volumes/test-container-bind-mounts-data")}:/data:rw`,
		],
	});
});

test("Exposed ports of a redis container", { sequential: true }, async () => {
	const container = new RedisContainer(redisStore, "test-container-ports");
	const startedContainer = await container.start();
	testContainers.push(startedContainer);
	await assertExposedPorts({
		container: startedContainer,
		ports: [6379, 8001],
	});
});

test(
	"Assigned connection string to environment variable after start",
	{ sequential: true },
	async () => {
		delete process.env.SIDECAR_REDIS_TEST_REDIS_TEST_URL;
		const container = new RedisContainer(
			redisStore,
			"test-container-connection-url",
		);
		const startedContainer = await container.start();
		testContainers.push(startedContainer);

		assert.strictEqual(
			process.env.SIDECAR_REDIS_TEST_REDIS_TEST_URL,
			`redis://localhost:${startedContainer.getMappedPort(6379)}`,
		);
	},
);

test("Connection string URL", { sequential: true }, async () => {
	const container = new RedisContainer(
		redisStore,
		"test-container-connection-url",
	);
	const startedContainer = await container.start();
	testContainers.push(startedContainer);

	assert.strictEqual(
		container.connectionStringURL,
		`redis://localhost:${startedContainer.getMappedPort(6379)}`,
	);
});

test("Web URL", { sequential: true }, async () => {
	const container = new RedisContainer(
		redisStore,
		"test-container-connection-url",
	);
	const startedContainer = await container.start();
	testContainers.push(startedContainer);

	assert.strictEqual(
		container.webURL,
		`http://localhost:${startedContainer.getMappedPort(8001)}/`,
	);
});
