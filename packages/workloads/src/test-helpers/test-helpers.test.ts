import { Redis as IORedis } from "ioredis";
import mysql from "mysql2/promise";
import nodemailer from "nodemailer";
import pg from "pg";
import {
	assert,
	beforeEach,
	describe,
	expect,
	vi,
	test as viTest,
} from "vitest";
import { test } from "~test/__setup__/container-test.js";
import {
	mysqlConnection,
	postgresDatabasePool,
} from "~test/__setup__/helpers.js";
import { startContainer } from "~workloads/containers/admin/container.js";
import { getExistingContainer } from "~workloads/containers/admin/introspection.js";
import {
	deleteMailerMessages,
	mailerMesages,
	mailerMessageHTML,
	mailerMessageText,
} from "~workloads/test-helpers/mailer.js";
import { truncateMySqlTables } from "~workloads/test-helpers/mysql.js";
import { truncatePostgresTables } from "~workloads/test-helpers/postgres.js";
import { flushRedis } from "~workloads/test-helpers/redis.js";
import {
	clearPerformedTasks,
	performedTasks,
} from "~workloads/test-helpers/task.js";
import { Mailer } from "~workloads/workloads/stateful/mailer.js";
import { MySqlDatabase } from "~workloads/workloads/stateful/mysql-database.js";
import { PostgresDatabase } from "~workloads/workloads/stateful/postgres-database.js";
import { Redis } from "~workloads/workloads/stateful/redis.js";
import { Task } from "~workloads/workloads/stateless/task/task.js";

test(
	"Truncate existing tables",
	{ sequential: true, timeout: 20000 },
	async ({ containers }) => {
		if (process.env.CI) {
			return;
		}
		const postgreSQL = new PostgresDatabase("truncate", {
			serverId: "truncate_test",
			client: (connectionStringEnvVar) => {
				return new pg.Pool({
					connectionString: process.env[connectionStringEnvVar],
				});
			},
		});

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
	"Truncate existing tables",
	{ sequential: true, timeout: 20000 },
	async ({ containers }) => {
		if (process.env.CI) {
			return;
		}
		const mysqlDb = new MySqlDatabase("app_db", {
			serverId: "mysql",
			client: async (connectionStringEnvVar) =>
				await mysql.createConnection(process.env[connectionStringEnvVar]!),
		});

		await startContainer(mysqlDb, {
			mode: "test",
			waitForHealthcheck: true,
		});
		const container = await getExistingContainer(mysqlDb, "test");
		assert(container);

		const connection = await mysqlConnection(mysqlDb);
		await connection.query(`CREATE TABLE IF NOT EXISTS users (name text)`);
		await connection.query(`TRUNCATE TABLE users`);
		await connection.query(`INSERT INTO users VALUES ('paul')`);
		await connection.query(`INSERT INTO users VALUES ('john')`);
		await connection.query(`INSERT INTO users VALUES ('ringo')`);
		await connection.query(`INSERT INTO users VALUES ('george')`);

		await connection.query(`CREATE TABLE IF NOT EXISTS cities (name text)`);
		await connection.query(`TRUNCATE TABLE cities`);
		await connection.query(`INSERT INTO cities VALUES ('New York')`);
		await connection.query(`INSERT INTO cities VALUES ('Paris')`);

		containers.push(container);

		const [usersBefore] =
			await connection.query<mysql.RowDataPacket[]>(`SELECT * from users;`);
		assert.strictEqual(usersBefore.length, 4);
		const [citiesBefore] = await connection.query<mysql.RowDataPacket[]>(
			`SELECT * from cities;`,
		);
		assert.strictEqual(citiesBefore.length, 2);

		await truncateMySqlTables(mysqlDb);

		const [usersAfter] =
			await connection.query<mysql.RowDataPacket[]>(`SELECT * from users;`);
		assert.strictEqual(usersAfter.length, 0);
		const [citiesAfter] = await connection.query<mysql.RowDataPacket[]>(
			`SELECT * from cities;`,
		);
		assert.strictEqual(citiesAfter.length, 0);

		await connection.end();
	},
);

test(
	"mailerMesages",
	{ sequential: true, timeout: 20000 },
	async ({ containers }) => {
		const mailer = new Mailer("transactions", (connectionStringEnvVar) =>
			nodemailer.createTransport(process.env[connectionStringEnvVar]!),
		);

		await startContainer(mailer, {
			mode: "test",
			waitForHealthcheck: true,
		});
		const container = await getExistingContainer(mailer, "test");
		assert(container);
		containers.push(container);

		await mailer.client.sendMail({
			from: "no-reply@workloads.com",
			to: "demo@example.com",
			subject: "Hello!",
			text: `Hi there!`,
			html: "<span>Hi There!<span>",
		});

		const response = await mailerMesages(mailer);
		assert(response.data?.messages);
		assert.strictEqual(response.data.messages.length, 1);
		assert.deepStrictEqual(response.data.messages[0]?.To, [
			{ Address: "demo@example.com", Name: "" },
		]);
		assert.deepStrictEqual(response.data.messages[0]?.From, {
			Address: "no-reply@workloads.com",
			Name: "",
		});

		// mailerMesages
		const messagesResponse = await mailerMesages(mailer);
		assert(messagesResponse.data?.messages);

		// mailerMessageText
		const messasgeTextResponse = await mailerMessageText(mailer, {
			path: { ID: messagesResponse.data?.messages[0]!.ID ?? "" },
		});
		assert.strictEqual(messasgeTextResponse.data, "Hi there!");

		// mailerMessageHTML
		const messageHTMLReponse = await mailerMessageHTML(mailer, {
			path: { ID: messagesResponse.data?.messages[0]!.ID ?? "" },
		});
		assert.strictEqual(messageHTMLReponse.data, "<span>Hi There!<span>");

		// Delete Messages
		await deleteMailerMessages(mailer, {});

		assert.strictEqual((await mailerMesages(mailer)).data?.messages?.length, 0);
	},
);

test(
	"FlushDB",
	{ sequential: true, timeout: 20000 },
	async ({ containers }) => {
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
