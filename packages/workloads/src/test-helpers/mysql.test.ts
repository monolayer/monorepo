import mysql from "mysql2/promise";
import { assert } from "vitest";
import { test } from "~test/__setup__/container-test.js";
import { mysqlConnection } from "~test/__setup__/helpers.js";
import { startContainer } from "~workloads/containers/admin/container.js";
import { getExistingContainer } from "~workloads/containers/admin/introspection.js";
import { truncateMySqlTables } from "~workloads/test-helpers/mysql.js";
import { MySqlDatabase } from "~workloads/workloads/stateful/mysql-database.js";

test("Truncate existing tables", { timeout: 20000 }, async ({ containers }) => {
	const mysqlDb = new MySqlDatabase("app_db", {
		databaseId: "mysql",
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
});
