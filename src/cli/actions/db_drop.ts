import * as p from "@clack/prompts";
import color from "picocolors";
import { exit } from "process";
import { pgPool } from "~/pg/pg_pool.js";
import { pgQueryExecuteWithResult } from "~/pg/pg_query.js";
import { importConfig } from "../../config.js";
import { ActionStatus } from "../command.js";
import { checkEnvironmentIsConfigured } from "../utils/clack.js";

export async function dbDrop(environment: string) {
	p.intro("Drop Database");
	const s = p.spinner();
	s.start("Creating database");
	const config = await importConfig();
	checkEnvironmentIsConfigured(config, environment, {
		spinner: s,
		outro: true,
	});
	const pool = pgPool(config, environment);

	const dropDb = await pgQueryExecuteWithResult<{
		datname: string;
	}>(pool.pool, `DROP DATABASE ${pool.config.database};`);
	if (dropDb.status === ActionStatus.Error) {
		s.stop(dropDb.error.message, 1);
		p.outro(`${color.red("Failed")}`);
		exit(1);
	}
	s.stop(`${color.green("dropped")} ${pool.config.database}`);
	p.outro("Done");
}