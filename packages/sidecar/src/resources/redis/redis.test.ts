import { createClient } from "redis";
import type { StartedTestContainer } from "testcontainers";
import {
	afterEach,
	assert,
	beforeAll,
	beforeEach,
	describe,
	test,
} from "vitest";
import { Redis } from "~sidecar/resources/redis/redis.js";
import { startTestContainer } from "~sidecar/start-test-container.js";
import { assertContainerImage } from "~test/__setup__/assertions.js";

interface RedisTestContext {
	redis: Redis<ReturnType<typeof createClient>>;
	startedContainer: StartedTestContainer;
}

describe("Redis client with test container", async () => {
	let redisStore: Redis<ReturnType<typeof createClient>>;

	beforeAll(async () => {
		redisStore = new Redis("test-redis-test", (resource) =>
			createClient({
				url: process.env[resource.connectionStringEnvVar()],
			}).on("error", (err) => console.error("Redis Client Error", err)),
		);
	});

	beforeEach<RedisTestContext>(async (context) => {
		context.redis = redisStore;
		context.startedContainer = await startTestContainer(context.redis);
		await context.redis.client.connect();
	});

	afterEach<RedisTestContext>(async (context) => {
		try {
			await context.redis.client.FLUSHDB();
		} catch {
			//
		}
		try {
			await context.redis.client.disconnect();
		} catch {
			//
		}
		try {
			await context.startedContainer.stop();
		} catch {
			//
		}
	});

	test<RedisTestContext>("Redis client commands against test container", async (context) => {
		assert.notOk(await context.redis.client.exists("hello"));

		await context.redis.client.set("hello", "World!");
		assert.ok(await context.redis.client.exists("hello"));

		const retrieved = await context.redis.client.get("hello");
		assert(retrieved !== null);
		assert.strictEqual(retrieved, "World!");

		await context.redis.client.del("hello");
		assert.isNull(await context.redis.client.get("hello"));
	});
});

test<RedisTestContext>(
	"Redis with custom image tag container",
	{ timeout: 10000000 },
	async () => {
		const redisResource = new Redis("test-image-tag", (resource) =>
			createClient({
				url: process.env[resource.connectionStringEnvVar()],
			}).on("error", (err) => console.error("Redis Client Error", err)),
		);

		redisResource.containerImageTag = "7.2.0-v12";
		const startedContainer = await startTestContainer(redisResource);
		await assertContainerImage({
			containerName: "redis_test_image_tag_test",
			expectedImage: "redis/redis-stack:7.2.0-v12",
		});
		await startedContainer.stop();
	},
);
