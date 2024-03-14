import { globalPool } from "~tests/setup.js";

const pool = globalPool();

await pool.query(`DROP DATABASE IF EXISTS test_kysely_kinetic;`);
await pool.query(`CREATE DATABASE test_kysely_kinetic`);

await pool.query(`DROP DATABASE IF EXISTS test_remote_schema;`);
await pool.query(`CREATE DATABASE test_remote_schema`);

pool.end();
