import { Redis as IORedis } from "ioredis";
import {
	assert,
	beforeEach,
	describe,
	expect,
	vi,
	test as viTest,
} from "vitest";
import { test } from "~test/__setup__/container-test.js";
import { postgresDatabasePool } from "~test/__setup__/helpers.js";
import { startContainer } from "~workloads/containers/admin/container.js";
import { getExistingContainer } from "~workloads/containers/admin/introspection.js";
import { truncatePostgresTables } from "~workloads/test-helpers/postgres.js";
import { flushRedis } from "~workloads/test-helpers/redis.js";
import {
	clearPerformedTasks,
	performedTasks,
} from "~workloads/test-helpers/task.js";
import { PostgresDatabase } from "~workloads/workloads/stateful/postgres-database.js";
import { Redis } from "~workloads/workloads/stateful/redis.js";
import { testDispatchers } from "~workloads/workloads/stateless/task/local.js";
import { Task } from "~workloads/workloads/stateless/task/task.js";

test(
	"Truncate existing tables PostgreSQL",
	{ sequential: true, timeout: 20000 },
	async ({ containers }) => {
		if (process.env.CI) {
			return;
		}
		const postgreSQL = new PostgresDatabase("truncate");

		const container = await startContainer(postgreSQL, {
			mode: "test",
			waitForHealthcheck: true,
		});
		containers.push(container);

		const pool = postgresDatabasePool(postgreSQL);
		await pool.query(`CREATE TABLE IF NOT EXISTS users (name text)`);
		await pool.query(`TRUNCATE TABLE users`);
		await pool.query(`INSERT INTO users VALUES ('paul')`);
		await pool.query(`INSERT INTO users VALUES ('john')`);
		await pool.query(`INSERT INTO users VALUES ('ringo')`);
		await pool.query(`INSERT INTO users VALUES ('george')`);

		await pool.query(`CREATE TABLE IF NOT EXISTS cities (name text)`);
		await pool.query(`TRUNCATE TABLE cities`);
		await pool.query(`INSERT INTO cities VALUES ('New York')`);
		await pool.query(`INSERT INTO cities VALUES ('Paris')`);

		const usersBefore = await pool.query(`SELECT * from users;`);
		assert.strictEqual(usersBefore.rows.length, 4);
		const citiesBefore = await pool.query(`SELECT * from cities;`);
		assert.strictEqual(citiesBefore.rows.length, 2);

		await truncatePostgresTables(postgreSQL);

		const usersAfter = await pool.query(`SELECT * from users;`);
		assert.strictEqual(usersAfter.rows.length, 0);
		const citiesAfter = await pool.query(`SELECT * from cities;`);
		assert.strictEqual(citiesAfter.rows.length, 0);

		await pool.end();
	},
);

test(
	"FlushDB",
	{ sequential: true, timeout: 20000 },
	async ({ containers }) => {
		const redis = new Redis("flushdb-test");
		await startContainer(redis, {
			mode: "test",
			waitForHealthcheck: false,
		});
		const container = await getExistingContainer(redis, "test");
		assert(container);
		containers.push(container);

		const client = new IORedis(redis.connectionString);

		await client.set("key", "1");
		await client.set("anotherKey", "2");

		assert.ok(await client.exists("key"));
		assert.ok(await client.exists("anotherKey"));

		await client.select(5);
		await client.set("key", "1");
		await client.set("anotherKey", "2");

		assert.ok(await client.exists("key"));
		assert.ok(await client.exists("anotherKey"));

		await client.select(0);
		await flushRedis(redis, 0);

		assert.notOk(await client.exists("key"));
		assert.notOk(await client.exists("anotherKey"));

		await client.select(5);

		assert.ok(await client.exists("key"));
		assert.ok(await client.exists("anotherKey"));

		await flushRedis(redis, 5);

		assert.notOk(await client.exists("key"));
		assert.notOk(await client.exists("anotherKey"));

		client.disconnect();
	},
);

describe("performed tasks", () => {
	beforeEach(() => {
		vi.stubEnv("NODE_ENV", "test");
		const dispatchers = testDispatchers;
		delete dispatchers["send-emails"];
	});

	viTest("performed tasks", async () => {
		const testTask = new Task<{ word: string }>(
			"Send emails",
			async () => {},
			{},
		);

		const executionId = await testTask.performLater({ word: "world" });

		const performed = performedTasks(testTask);

		const performedTask = performed[0];
		assert(performedTask);
		expect(performedTask.executionId).toStrictEqual(executionId);
		expect(performedTask.data).toStrictEqual({ word: "world" });
	});

	viTest("clear performed tasks", async () => {
		const testTask = new Task<{ word: string }>(
			"Send emails",
			async () => {},
			{},
		);

		await testTask.performLater({ word: "hello" });
		await testTask.performLater({ word: "world" });

		expect(performedTasks(testTask).length).toBe(2);

		clearPerformedTasks(testTask);

		expect(performedTasks(testTask).length).toBe(0);
	});
});
