import dotenv from "dotenv";
dotenv.config();
import pg from "pg";
import { env } from "process";

const pool = new pg.Pool({ connectionString: env.POSTGRES_URL });
pool.query(`DROP DATABASE IF EXISTS ${env.DATABASE_NAME}`).then(() => {
	pool.end().then(() => {});
});
