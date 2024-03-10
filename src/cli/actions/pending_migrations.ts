import * as p from "@clack/prompts";
import { Kysely, PostgresDialect } from "kysely";
import path from "path";
import pg from "pg";
import color from "picocolors";
import { importConfig } from "~/config.js";
import { fetchPendingMigrations } from "~/migrations/info.js";
import {
	checkAutoPilotLock,
	checkEnvironmentIsConfigured,
} from "../utils/clack.js";

export async function pendingMigrations(environment: string) {
	p.intro("Pending Migrations");
	const config = await importConfig();
	const environmentConfig = checkEnvironmentIsConfigured(config, environment, {
		outro: true,
	});
	checkAutoPilotLock({
		outro: true,
	});

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const db = new Kysely<any>({
		dialect: new PostgresDialect({
			pool: new pg.Pool(environmentConfig),
		}),
	});

	const migrations = await fetchPendingMigrations(config, db);
	if (migrations.length === 0) {
		p.log.info(`${color.green("No pending migrations")}`);
	} else {
		for (const migration of migrations) {
			const relativePath = path.relative(process.cwd(), migration.path);
			p.log.warn(`${color.yellow("pending")} ${relativePath}`);
		}
	}

	db.destroy();

	p.outro("Done");
}
