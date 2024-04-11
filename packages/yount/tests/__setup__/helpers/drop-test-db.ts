import { globalPool } from "~tests/__setup__/setup.js";

const pool = globalPool();
await pool.query(`DROP DATABASE IF EXISTS test_kysely_yount;`);
await pool.query(`DROP DATABASE IF EXISTS test_remote_schema;`);
pool.end();
