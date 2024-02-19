import { appendFileSync } from "fs";
import path from "path";
import * as p from "@clack/prompts";
import { execa } from "execa";
import color from "picocolors";
import { env, exit } from "process";
import { importConfig } from "../../config.js";
import { pgPoolAndConfig } from "../../database/pg/pg_pool.js";
import { pgQueryExecuteWithResult } from "../../database/pg/pg_query.js";
import { ActionStatus, runCommand } from "../command.js";
import { checkEnvironmentIsConfigured } from "../utils/clack.js";

export async function structureDump(environment: string) {
	p.intro("Structure Dump");
	const s = p.spinner();
	s.start("Dumping database structure");
	const config = await importConfig();
	checkEnvironmentIsConfigured(config, environment, {
		spinner: s,
		outro: true,
	});
	const pool = pgPoolAndConfig(config, environment);

	const searchPathQueryResult = await pgQueryExecuteWithResult<{
		search_path: string;
	}>(pool.pool, "SHOW search_path");
	if (searchPathQueryResult.status === ActionStatus.Error) {
		s.stop(
			`${color.red("query error")}: ${searchPathQueryResult.error.message}`,
			1,
		);
		p.outro(`${color.red("Failed")}`);
		exit(1);
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

	if (result.error === undefined && searchPath !== undefined)
		appendFileSync(`${dumpPath}`, `SET search_path TO ${searchPath};\n\n`);
	if (migrationInfo !== undefined) appendFileSync(`${dumpPath}`, migrationInfo);
	if (result.error instanceof Error) {
		s.stop(result.error.message, 1);
		p.outro(`${color.red("Failed")}`);
		exit(1);
	}
	s.stop(`${color.green("dumped")} ${pool.config.database}`);
	p.outro("Done");
}

async function dumpMigrationInfoArgs(database: string) {
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
