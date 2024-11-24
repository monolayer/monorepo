import { Redis as IORedis } from "ioredis";
import { assert } from "vitest";
import { test } from "~test/__setup__/container-test.js";
import { startContainer } from "~workloads/containers/admin/container.js";
import { getExistingContainer } from "~workloads/containers/admin/introspection.js";
import { flushRedis } from "~workloads/test-helpers/redis.js";
import { Redis } from "~workloads/workloads/stateful/redis.js";

test("FlushDB", async ({ containers }) => {
	const redis = new Redis(
		"flushdb-test",
		(envVarName) => new IORedis(process.env[envVarName]!),
	);
	await startContainer(redis, {
		mode: "test",
		waitForHealthcheck: false,
	});
	const container = await getExistingContainer(redis, "test");
	assert(container);
	containers.push(container);

	const client = redis.client;

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
	const redis = new Redis(
		"flushdb-test",
		(envVarName) => new IORedis(process.env[envVarName]!),
	);
	const container = await startContainer(redis, {
		mode: "test",
		waitForHealthcheck: false,
	});
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
