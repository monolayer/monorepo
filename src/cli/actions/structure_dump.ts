import { appendFileSync } from "fs";
import path from "path";
import * as p from "@clack/prompts";
import color from "picocolors";
import { env, exit } from "process";
import { importConfig } from "../../config.js";
import { pgPool } from "../../pg/pg_pool.js";
import { pgQueryExecuteWithResult } from "../../pg/pg_query.js";
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
	const pool = pgPool(config, environment);

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
	if (result.error === undefined && searchPath !== undefined)
		appendFileSync(`${dumpPath}`, `SET search_path TO ${searchPath};\n\n`);
	if (result.error instanceof Error) {
		s.stop(result.error.message, 1);
		p.outro(`${color.red("Failed")}`);
		exit(1);
	}
	s.stop(`${color.green("dumped")} ${pool.config.database}`);
	p.outro("Done");
}
