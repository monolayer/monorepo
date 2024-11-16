import { createClient } from "redis";
import { Equal, Expect } from "type-testing";
import { assert, expect } from "vitest";
import { RedisContainer } from "~sidecar/containers/redis.js";
import { Redis } from "~sidecar/resources/redis.js";
import { assertContainerImage } from "~test/__setup__/assertions.js";
import { test } from "~test/__setup__/container-test.js";

test("Redis client commands against test container", async ({ containers }) => {
	const redisStore = new Redis(
		"test-redis-client-commands",
		(connectionStringEnvVar) =>
			createClient({
				url: process.env[connectionStringEnvVar],
			}).on("error", (err) => console.error("Redis Client Error", err)),
	);

	const container = new RedisContainer(redisStore);
	const startedContainer = await container.start();
	containers.push(startedContainer);

	const client = redisStore.client;
	await client.connect();

	assert.notOk(await client.exists("hello"));

	await client.set("hello", "World!");
	assert.ok(await client.exists("hello"));

	const retrieved = await client.get("hello");
	assert(retrieved !== null);
	assert.strictEqual(retrieved, "World!");

	await client.del("hello");
	assert.isNull(await client.get("hello"));
	await client.disconnect();
});

test(
	"Redis with custom image tag container",
	{ sequential: true, retry: 2 },
	async ({ containers }) => {
		const redisResource = new Redis(
			"rd-custom-image-tag",
			(connectionStringEnvVar) =>
				createClient({
					url: process.env[connectionStringEnvVar],
				}).on("error", (err) => console.error("Redis Client Error", err)),
		);

		redisResource.containerImageTag = "7.2.0-v12";
		const container = new RedisContainer(redisResource);
		const startedContainer = await container.start();
		containers.push(startedContainer);
		await assertContainerImage({
			containerName: container.name,
			expectedImage: "redis/redis-stack:7.2.0-v12",
		});
		await startedContainer.stop();
	},
);

test("client type", async () => {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const redisResource = new Redis(
		"test-buildOutput",
		(connectionStringEnvVar) =>
			createClient({
				url: process.env[connectionStringEnvVar],
			}).on("error", (err) => console.error("Redis Client Error", err)),
	);

	type ClientType = typeof redisResource.client;
	type ExpectedType = ReturnType<typeof createClient>;
	const isEqual: Expect<Equal<ClientType, ExpectedType>> = true;
	expect(isEqual).toBe(true);
});

test("build", async () => {
	const redisResource = new Redis(
		"test-buildOutput",
		(connectionStringEnvVar) =>
			createClient({
				url: process.env[connectionStringEnvVar],
			}).on("error", (err) => console.error("Redis Client Error", err)),
	);

	const buildOutput = redisResource.build();
	assert.deepStrictEqual(buildOutput, {
		kind: "redis",
		id: "test-build-output",
		connectionStringEnvVar: "SIDECAR_REDIS_TEST_BUILD_OUTPUT_URL",
	});
});
