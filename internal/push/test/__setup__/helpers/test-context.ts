import { mkdirSync, rmSync } from "fs";
import { chdir } from "node:process";
import path from "path";
import { vi, type TaskContext } from "vitest";
import { ChangesetPhase } from "~push/changeset/types/changeset.js";
import {
	kyselyMigrator,
	kyselyWithCustomDB,
	type DbContext,
} from "~tests/__setup__/helpers/kysely.js";
import { dbNameForTest } from "~tests/__setup__/helpers/names.js";
import { currentWorkingDirectory, globalPool } from "~tests/__setup__/setup.js";

export async function teardownContext(context: TaskContext & DbContext) {
	try {
		chdir(context.currentWorkingDirectory);
		await context.kysely.destroy();
		rmSync(context.folder, { recursive: true, force: true });
		vi.restoreAllMocks();
	} catch {
		/* empty */
	}
}

export async function setUpContext(context: TaskContext & DbContext) {
	const pool = globalPool();
	context.currentWorkingDirectory = currentWorkingDirectory();
	context.dbName = dbNameForTest(context);
	await pool.query(`DROP DATABASE IF EXISTS "${context.dbName}"`);
	await pool.query(`CREATE DATABASE "${context.dbName}"`);
	context.kysely = await kyselyWithCustomDB(context.dbName);
	const dateStr = new Date().toISOString().replace(/[-:]/g, "").split(".")[0];
	context.folder = path.join(
		currentWorkingDirectory(),
		`tmp/schema_migrations/${dateStr}-${context.dbName}`,
	);
	mkdirSync(
		path.join(context.folder, "migrations", "default", ChangesetPhase.Alter),
		{
			recursive: true,
		},
	);
	mkdirSync(
		path.join(context.folder, "migrations", "default", ChangesetPhase.Expand),
		{
			recursive: true,
		},
	);
	mkdirSync(
		path.join(context.folder, "migrations", "default", ChangesetPhase.Contract),
		{
			recursive: true,
		},
	);
	context.migrator = await kyselyMigrator(context.kysely, context.folder);
	chdir(context.folder);
}
