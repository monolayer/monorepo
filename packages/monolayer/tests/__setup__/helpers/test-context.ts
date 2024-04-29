import {
	appendFileSync,
	copyFileSync,
	mkdirSync,
	rmSync,
	writeFileSync,
} from "fs";
import { FileMigrationProvider, Migrator, type Kysely } from "kysely";
import fs from "node:fs/promises";
import path from "path";
import type { Pool } from "pg";
import { chdir, cwd } from "process";
import { vi, type TaskContext } from "vitest";
import {
	configurationsTemplate,
	monolayerTemplate,
} from "~tests/__setup__/fixtures/program.js";
import {
	kyselyMigrator,
	kyselyWithCustomDB,
	type DbContext,
} from "~tests/__setup__/helpers/kysely.js";
import { globalPool, globalPoolTwo } from "~tests/__setup__/setup.js";
import { dbNameForTest, programFolder } from "./names.js";

export async function teardownContext(context: TaskContext & DbContext) {
	try {
		await context.kysely.destroy();
		// rmSync(context.folder, { recursive: true, force: true });
		vi.restoreAllMocks();
	} catch (e) {
		/* empty */
	}
}

export async function setUpContext(context: TaskContext & DbContext) {
	const pool = globalPool();
	context.dbName = dbNameForTest(context);
	await pool.query(`DROP DATABASE IF EXISTS "${context.dbName}"`);
	await pool.query(`CREATE DATABASE "${context.dbName}"`);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	context.kysely = await kyselyWithCustomDB(context.dbName);
	const dateStr = new Date().toISOString().replace(/[-:]/g, "").split(".")[0];
	context.folder = path.join(
		cwd(),
		`tmp/schema_migrations/${dateStr}-${context.dbName}`,
	);
	mkdirSync(path.join(context.folder, "revisions"), { recursive: true });
	context.migrator = await kyselyMigrator(context.kysely, context.folder);
}

export async function setupProgramContext(
	context: TaskContext & ProgramContext,
	createDb = true,
) {
	context.currentWorkingDirectory = cwd();
	context.folder = path.join(cwd(), `tmp/programs/${programFolder(context)}`);
	rmSync(context.folder, { recursive: true, force: true });
	mkdirSync(path.join(context.folder, "db", "revisions", "default"), {
		recursive: true,
	});
	mkdirSync(path.join(context.folder, "db", "dumps"), {
		recursive: true,
	});
	context.pool = globalPool();
	context.poolTwo = globalPoolTwo();
	context.dbName = dbNameForTest(context);
	await context.pool.query(`DROP DATABASE IF EXISTS "${context.dbName}"`);
	await context.poolTwo.query(
		`DROP DATABASE IF EXISTS "${context.dbName}_test"`,
	);
	await context.pool.query(`DROP DATABASE IF EXISTS "${context.dbName}_stats"`);
	await context.poolTwo.query(
		`DROP DATABASE IF EXISTS "${context.dbName}_stats_test"`,
	);
	if (createDb) {
		await context.pool.query(`CREATE DATABASE "${context.dbName}"`);
		await context.poolTwo.query(`CREATE DATABASE "${context.dbName}_test"`);
		await context.pool.query(`CREATE DATABASE "${context.dbName}_stats"`);
		await context.poolTwo.query(
			`CREATE DATABASE "${context.dbName}_stats_test"`,
		);
	}

	const dbMigrator = await dbAndMigrator(context);
	context.kysely = dbMigrator.db;
	context.migrator = dbMigrator.migrator;
	const monolayerConfig = monolayerTemplate.render();
	appendFileSync(path.join(context.folder, "monolayer.ts"), monolayerConfig);

	const configurations = configurationsTemplate.render({
		dbName: context.dbName,
	});
	writeFileSync(
		path.join(context.folder, "db", "configuration.ts"),
		configurations,
	);

	writeFileSync(path.join(context.folder, "db", "schema.ts"), schemaFile);

	copyMigrations(
		[
			"20240405T120024-regulus-mint",
			"20240405T120250-canopus-teal",
			"20240405T153857-alphard-black",
			"20240405T154913-mirfak-mustard",
		],
		context,
	);
	chdir(context.folder);
}

export async function teardownProgramContext(
	context: TaskContext & ProgramContext,
) {
	rmSync(context.folder, { recursive: true, force: true });
	try {
		await context.kysely.destroy();
	} catch (e) {
		/* empty */
	}
	chdir(context.currentWorkingDirectory);
}

export type ProgramContext = {
	folder: string;
	pool: Pool;
	poolTwo: Pool;
	dbName: string;
	currentWorkingDirectory: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	kysely: Kysely<any>;
	migrator: Migrator;
};

function copyMigration(migrationName: string, context: ProgramContext) {
	copyFileSync(
		`tests/__setup__/fixtures/revisions/${migrationName}.ts`,
		path.join(
			context.folder,
			"db",
			"revisions",
			"default",
			`${migrationName}.ts`,
		),
	);
}

export function copyMigrations(migrations: string[], context: ProgramContext) {
	migrations.forEach((migration) => {
		copyMigration(migration, context);
	});
}

export async function dbAndMigrator(context: ProgramContext) {
	return {
		db: await kyselyWithCustomDB(context.dbName),
		migrator: new Migrator({
			db: await kyselyWithCustomDB(context.dbName),
			provider: new FileMigrationProvider({
				fs,
				path,
				migrationFolder: path.join(
					context.folder,
					"db",
					"revisions",
					"default",
				),
			}),
		}),
	};
}

const pgPath = path.join(cwd(), "src", "pg.ts");
const schemaFile = `import { schema, table, text } from "${pgPath}";

export const dbSchema = schema({
  tables: {
    regulus_mint: table({
			columns: {
				name: text().notNull(),
			},
		}),
    regulur_door: table({
			columns: {
				name: text().notNull(),
			},
		}),
    alphard_black: table({
			columns: {
				name: text().notNull(),
			},
		}),
    mirfak_mustart: table({
			columns: {
				name: text().notNull(),
			},
		}),
  },
});
`;
