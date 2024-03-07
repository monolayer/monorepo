import * as p from "@clack/prompts";
import { Kysely, PostgresDialect } from "kysely";
import fs from "node:fs/promises";
import path from "node:path";
import { cwd, exit } from "node:process";
import pg from "pg";
import color from "picocolors";
import { importConfig } from "~/config.js";
import { checkEnvironmentIsConfigured } from "../utils/clack.js";

export async function autopilotRevert() {
	p.intro("Autopilot Revert");
	const s = p.spinner();

	const config = await importConfig();
	const environmentConfig = checkEnvironmentIsConfigured(
		config,
		"development",
		{
			spinner: s,
			outro: true,
		},
	);

	const migrationFiles = await fs.readdir(
		path.join(cwd(), ".kinetic", "autopilot"),
	);

	const autoPilotMigrationFiles = migrationFiles
		.filter((f) => f.includes("autopilot"))
		.sort()
		.reverse();

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const kysely = new Kysely<any>({
		dialect: new PostgresDialect({
			pool: new pg.Pool(environmentConfig),
		}),
	});

	for (const file of autoPilotMigrationFiles) {
		const migrationPath = path.join(cwd(), ".kinetic", "autopilot", file);
		const migration = await import(migrationPath);
		try {
			await migration.down(kysely);
			await fs.unlink(migrationPath);
			p.log.info(`${color.green("reverted")} ${file}`);
		} catch (error) {
			console.error(error);
			p.outro(color.red("Failed"));
			exit(1);
		}
	}
	await fs.unlink(path.join(cwd(), ".kinetic", "autopilot.lock"));
	p.outro("Done");
	exit(0);
}
