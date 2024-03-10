#!/usr/bin/env tsx

import { Kysely, PostgresDialect } from "kysely";
import fs from "node:fs/promises";
import path from "path";
import pg from "pg";
import { cwd, exit } from "process";
import { ActionStatus } from "~/cli/command.js";
import { importConfig } from "~/config.js";
import { changeset } from "~/database/changeset.js";
import { localSchema, remoteSchema } from "~/database/introspection/schemas.js";
import { generateMigrationFiles } from "~/database/migrations/generate.js";
import { fetchPendingMigrations } from "~/database/migrations/info.js";

async function main() {
	const config = await importConfig();
	const currentConfigFolder = config.folder;
	config.folder = ".kinetic";

	const environmentConfig =
		config.environments["development" as keyof (typeof config)["environments"]];

	if (environmentConfig === undefined) {
		console.log(
			"Kinetic autopilot can't continue. Configuration not found for environment 'development'. Please check your kinetic.ts file.",
		);
		process.exit(0);
	}

	const srcDir = path.join(cwd(), currentConfigFolder, "migrations");
	const targetDir = path.join(cwd(), config.folder, "autopilot");

	await copyFiles(srcDir, targetDir);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const kysely = new Kysely<any>({
		dialect: new PostgresDialect({
			pool: new pg.Pool(environmentConfig),
		}),
	});

	const pendingMigrations = (
		await fetchPendingMigrations(config, kysely, "autopilot")
	).filter((m) => !m.name.includes("autopilot"));

	if (pendingMigrations.length > 0) {
		console.log(
			"The are penging migrations. Please execute the pending migrations before running Kinetic Autopilot.",
		);
		exit(0);
	}

	const remoteColumnInfo = await remoteSchema(kysely);
	if (remoteColumnInfo.status === ActionStatus.Error) {
		console.log(
			"Unexpected Error while fetching database information",
			remoteColumnInfo.error,
		);
		exit(0);
	}

	const lc = await import(
		path.join(process.cwd(), currentConfigFolder, "schema.ts")
	);

	if (lc.database === undefined) {
		console.log("Kinetic AutoPilot: local schema not found");
		exit(0);
	}

	const localInfo = localSchema(lc.database, remoteColumnInfo.result);

	const cset = changeset(localInfo, remoteColumnInfo.result);

	if (cset.length > 0) {
		const dateStr = new Date().toISOString().replace(/[-:]/g, "").split(".")[0];
		const migrationName = `${dateStr}-autopilot.ts`;
		generateMigrationFiles(cset, ".kinetic", "autopilot", migrationName);

		try {
			const migrationPath = path.join(
				cwd(),
				".kinetic",
				"autopilot",
				migrationName,
			);
			await fs.access(migrationPath, fs.constants.F_OK);
			const autoPilotMigration = await import(migrationPath);
			await autoPilotMigration.up(kysely);
		} catch (error) {
			console.log("Kinetic Autopilot Error:", error);
		}
	}
	exit(0);
}

main().catch(console.error);

async function copyFiles(srcDir: string, targetDir: string) {
	try {
		// Read the source directory
		const files = await fs.readdir(srcDir, { withFileTypes: true });
		for (const file of files) {
			if (!file.isDirectory()) {
				const srcFilePath = path.join(srcDir, file.name);
				const targetFilePath = path.join(targetDir, file.name);
				await fs.copyFile(srcFilePath, targetFilePath);
			}
		}
	} catch (error) {
		console.log(`Failed to copy files: ${error}`);
	}
}
