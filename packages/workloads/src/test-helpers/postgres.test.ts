import pg from "pg";
import { assert } from "vitest";
import { test } from "~test/__setup__/container-test.js";
import { postgresDatabasePool } from "~test/__setup__/helpers.js";
import { startContainer } from "~workloads/containers/admin/container.js";
import { truncatePostgresTables } from "~workloads/test-helpers/postgres.js";
import { PostgresDatabase } from "~workloads/workloads/stateful/postgres-database.js";

test("Truncate existing tables", async ({ containers }) => {
	const postgreSQL = new PostgresDatabase("truncate", {
		serverId: "truncate_test",
		client: (connectionStringEnvVar) => {
			console.dir(process.env[connectionStringEnvVar]);
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
});
