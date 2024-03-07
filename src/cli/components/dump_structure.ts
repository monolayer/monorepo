import { execa } from "execa";
import { appendFileSync } from "fs";
import path from "path";
import { env } from "process";
import type { Config } from "~/config.js";
import { pgPoolAndConfig } from "~/database/pg/pg_pool.js";
import { pgQueryExecuteWithResult } from "~/database/pg/pg_query.js";
import { ActionStatus, isExecaError, runCommand } from "../command.js";

export async function dumpStructure(config: Config, environment: string) {
	const pool = pgPoolAndConfig(config, environment);

	const searchPathQueryResult = await pgQueryExecuteWithResult<{
		search_path: string;
	}>(pool.pool, "SHOW search_path");
	if (searchPathQueryResult.status === ActionStatus.Error) {
		return searchPathQueryResult.error;
	}

	const searchPath = searchPathQueryResult.result[0]?.search_path;

	env.PGHOST = `${pool.config.host}`;
	env.PGPORT = `${pool.config.port}`;
	env.PGUSER = `${pool.config.user}`;
	env.PGPASSWORD = `${pool.config.password}`;

	const dumpPath = path.join(config.folder, `${pool.config.database}.sql`);

	const args = [
		"--schema-only",
		"--no-privileges",
		"--no-owner",
		`--file=${dumpPath}`,
		"--schema=public",
		`${pool.config.database}`,
	];

	const result = await runCommand("pg_dump", args);
	const migrationInfo = await dumpMigrationInfoArgs(pool.config.database || "");

	if (result.success === false) {
		if (isExecaError(result.error))
			return new Error(result.error.stderr?.toString());
		if (result.error instanceof Error) return result.error;
	}

	if (searchPath !== undefined)
		appendFileSync(`${dumpPath}`, `SET search_path TO ${searchPath};\n\n`);
	if (migrationInfo !== undefined) appendFileSync(`${dumpPath}`, migrationInfo);
	return pool.config.database as string;
}

export async function dumpMigrationInfoArgs(database: string) {
	const migrationDumpArgs = [
		"--no-privileges",
		"--no-owner",
		"--schema=public",
		"--inserts",
		"--table=kysely_migration_lock",
		"--table=kysely_migration",
		"-a",
		"--no-comments",
		`${database}`,
	];
	const dump = execa("pg_dump", migrationDumpArgs);
	if (dump.pipeStdout !== undefined) {
		const { stdout } = await dump.pipeStdout(execa("grep", ["INSERT INTO"]));
		return stdout;
	}
}
