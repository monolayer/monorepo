import { createClient } from "redis";
import { assert } from "vitest";
import { getExistingContainer } from "~sidecar/containers/admin/introspection.js";
import { startTestContainer } from "~sidecar/containers/admin/start-test-container.js";
import { flushRedis } from "~sidecar/test-helpers/redis.js";
import { Redis } from "~sidecar/workloads/stateful/redis.js";
import { test } from "~test/__setup__/container-test.js";

test("FlushDB", async ({ containers }) => {
	const redis = new Redis("flushdb-test", async (connectionStringEnvVar) => {
		const client = createClient({
			url: process.env[connectionStringEnvVar],
		}).on("error", (err) => console.error("Redis Client Error", err));
		await client.connect();
		return client;
	});
	await startTestContainer(redis);
	const container = await getExistingContainer(redis);
	assert(container);
	containers.push(container);

	const client = await redis.client;

	await client.set("key", "1");
	await client.set("anotherKey", "2");

	assert.ok(await client.exists("key"));
	assert.ok(await client.exists("anotherKey"));

	await flushRedis(redis);

	assert.notOk(await client.exists("key"));
	assert.notOk(await client.exists("anotherKey"));

	await client.disconnect();
});

test("FlushDB on another database", async ({ containers }) => {
	const redis = new Redis("flushdb-test", async (connectionStringEnvVar) => {
		const client = createClient({
			url: process.env[connectionStringEnvVar],
		}).on("error", (err) => console.error("Redis Client Error", err));
		await client.connect();
		return client;
	});
	await startTestContainer(redis);
	const container = await getExistingContainer(redis);
	assert(container);
	containers.push(container);

	const client = await redis.client;

	await client.set("key", "1");
	await client.set("anotherKey", "2");

	assert.ok(await client.exists("key"));
	assert.ok(await client.exists("anotherKey"));

	await client.select(5);
	await client.set("key", "1");
	await client.set("anotherKey", "2");

	assert.ok(await client.exists("key"));
	assert.ok(await client.exists("anotherKey"));

	await flushRedis(redis, 5);

	await client.select(0);
	assert.ok(await client.exists("key"));
	assert.ok(await client.exists("anotherKey"));

	await client.select(5);
	assert.notOk(await client.exists("key"));
	assert.notOk(await client.exists("anotherKey"));

	await client.disconnect();
});
