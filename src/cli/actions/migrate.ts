import fs from "node:fs/promises";
import path from "path";
import * as p from "@clack/prompts";
import {
	FileMigrationProvider,
	Kysely,
	Migrator,
	PostgresDialect,
} from "kysely";
import pg from "pg";
import color from "picocolors";
import { cwd } from "process";
import { importConfig } from "~/config.js";
import { checkEnvironmentIsConfigured } from "../utils/clack.js";

export async function migrate(environment: string) {
	p.intro("Migrate");
	const config = await importConfig();
	const environmentConfig =
		config.environments[environment as keyof (typeof config)["environments"]];

	checkEnvironmentIsConfigured(config, environment, {
		outro: true,
	});

	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	const db = new Kysely<any>({
		dialect: new PostgresDialect({
			pool: new pg.Pool(environmentConfig),
		}),
	});

	const migrator = new Migrator({
		db,
		provider: new FileMigrationProvider({
			fs,
			path,
			migrationFolder: path.join(cwd(), config.folder, "migrations"),
		}),
	});
	const { error, results } = await migrator.migrateToLatest();
	if (error !== undefined || results === undefined) {
		p.cancel("Unexpected error while migrating");
		console.error(error);
		process.exit(1);
	}
	for (const result of results) {
		switch (result.status) {
			case "Success":
				p.log.info(`${color.green("applied")} ${result.migrationName}`);
				break;
			case "Error":
				p.log.error(`${color.red("error")} ${result.migrationName}`);
				break;
			case "NotExecuted":
				p.log.warn(`${color.yellow("not executed")} ${result.migrationName}`);
				break;
		}
	}

	db.destroy();
	p.outro("Done");
}
