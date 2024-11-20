import { createClient } from "redis";
import { Equal, Expect } from "type-testing";
import { assert, expect } from "vitest";
import { RedisContainer } from "~workloads/containers/redis.js";
import { Redis } from "~workloads/workloads/stateful/redis.js";
import { startContainer, test } from "~test/__setup__/container-test.js";

test("Redis client commands against test container", async ({ containers }) => {
	const redisStore = new Redis(
		"test-redis-client-commands",
		(connectionStringEnvVar) =>
			createClient({
				url: process.env[connectionStringEnvVar],
			}).on("error", (err) => console.error("Redis Client Error", err)),
	);

	const container = new RedisContainer(redisStore);
	const startedContainer = await startContainer(container);
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

test("client type", async () => {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const redisWorkload = new Redis(
		"test-buildOutput",
		(connectionStringEnvVar) =>
			createClient({
				url: process.env[connectionStringEnvVar],
			}).on("error", (err) => console.error("Redis Client Error", err)),
	);

	type ClientType = typeof redisWorkload.client;
	type ExpectedType = ReturnType<typeof createClient>;
	const isEqual: Expect<Equal<ClientType, ExpectedType>> = true;
	expect(isEqual).toBe(true);
});
