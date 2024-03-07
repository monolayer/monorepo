import dotenv from "dotenv";
import pg from "pg";
import { env } from "process";
dotenv.config();

const pool = new pg.Pool({ connectionString: env.POSTGRES_URL });
pool.query(`DROP DATABASE IF EXISTS ${env.DATABASE_NAME}`).then(() => {
	pool.end().then(() => {});
});
