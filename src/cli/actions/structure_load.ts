import { promises as fs } from "fs";
import path from "path";
import * as p from "@clack/prompts";
import color from "picocolors";
import { env, exit } from "process";
import { importConfig } from "../../config.js";
import { pgPoolAndConfig } from "../../pg/pg_pool.js";
import { pgQueryExecuteWithResult } from "../../pg/pg_query.js";
import { ActionStatus, runCommand } from "../command.js";
import { checkEnvironmentIsConfigured } from "../utils/clack.js";

export async function structureLoad(environment: string) {
	p.intro("Structure Load");
	const s = p.spinner();
	s.start("Loading database structure");
	const config = await importConfig();
	checkEnvironmentIsConfigured(config, environment, {
		spinner: s,
		outro: true,
	});
	const pool = pgPoolAndConfig(config, environment);

	const searchPathQueryResult = await pgQueryExecuteWithResult<{
		datname: string;
	}>(pool.pool, "SELECT datname FROM pg_database");
	if (searchPathQueryResult.status === ActionStatus.Error) {
		s.stop(searchPathQueryResult.error.message, 1);
		p.outro(`${color.red("Failed")}`);
		exit(1);
	}

	const findDatabase = searchPathQueryResult.result.find((row) => {
		return row.datname === pool.config.database;
	});

	if (findDatabase === undefined) {
		s.stop(`Database ${pool.config.database} does not exist.`, 1);
		p.log.info(
			`To resolve this error:

- Check that the database ${pool.config.database} is created.
  You may need to create it with: npx kinetic db:create -e ${environment}

- Check your kinetic.ts configuration.
  The ${environment} environment database name should be: ${pool.config.database}.`,
		);
		p.outro(`${color.red("Failed")}`);
		exit(1);
	}

	env.PGHOST = `${pool.config.host}`;
	env.PGPORT = `${pool.config.port}`;
	env.PGUSER = `${pool.config.user}`;
	env.PGPASSWORD = `${pool.config.password}`;

	const structurePath = path.join(config.folder, `${pool.config.database}.sql`);
	try {
		await fs.stat(structurePath);
	} catch (error) {
		s.stop(`Structure file database ${pool.config.database} not found.`, 1);
		p.log.info(`Expected location: ${structurePath}`);
		p.outro(`${color.red("Failed")}`);
		exit(1);
	}

	const args = [`--dbname=${pool.config.database}`, `--file=${structurePath}`];

	const result = await runCommand("psql", args);
	if (result.error instanceof Error) {
		s.stop(`${color.red("error")} ${result.error.message}`, 1);
		p.outro(`${color.red("Failed")}`);
		exit(1);
	}
	s.stop(`${color.green("loaded")} ${pool.config.database}`);
	p.outro("Done");
}
