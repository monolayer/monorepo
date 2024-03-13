import dotenv from "dotenv";
import pg from "pg";
import { env } from "process";
dotenv.config();

const pool = new pg.Pool({ connectionString: env.POSTGRES_URL });

pool.query(`DROP DATABASE IF EXISTS ${env.DATABASE_NAME}`).then(() => {
	pool.query(`CREATE DATABASE ${env.DATABASE_NAME}`).then(() => {});
});

pool.query(`DROP DATABASE IF EXISTS test_remote_schema`).then(() => {
	pool.query(`CREATE DATABASE test_remote_schema`).then(() => {
		pool.end().then(() => {});
	});
});
