import dotenv from "dotenv";
import pg from "pg";

export function databasePoolFromEnvironment(database: string) {
	dotenv.config();
	return new pg.Pool({
		database,
		user: process.env.POSTGRES_USER,
		password: process.env.POSTGRES_PASSWORD,
		host: process.env.POSTGRES_HOST,
		port: Number(process.env.POSTGRES_PORT ?? 5432),
	});
}
