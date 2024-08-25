import * as p from "@clack/prompts";
import { fail, gen, tryPromise } from "effect/Effect";
import { promises as fs, mkdirSync, writeFileSync } from "fs";
import nunjucks from "nunjucks";
import path from "path";
import color from "picocolors";
import { cwd } from "process";
import { DbFolderState, UndefinedDbFolderError } from "../state/db-folder.js";

export const initFolderAndFiles = gen(function* () {
	const dbFolder = yield* DbFolderState.current;
	const dbFolderPath = dbFolder?.path;
	if (dbFolderPath === undefined) {
		yield* fail(new UndefinedDbFolderError());
	} else {
		yield* tryPromise(async () => {
			await createFile(
				path.join(cwd(), "monolayer.config.ts"),
				configTemplate.render({
					databasePath: path.join(dbFolderPath, "databases.ts"),
				}),
				true,
			);
			await createDir(dbFolderPath, true);
			await createFile(`${dbFolderPath}/client.ts`, dbTemplate.render(), true);
			await createFile(
				`${dbFolderPath}/schema.ts`,
				schemaTemplate.render(),
				true,
			);
			await createFile(
				`${dbFolderPath}/databases.ts`,
				databasesTemplate.render(),
				true,
			);
			await createFile(`${dbFolderPath}/seed.ts`, seedTemplate.render(), true);
		});
	}
});

export async function createDir(path: string, outputLog = false) {
	try {
		await fs.access(path);
		if (outputLog) log.lineMessage(`${color.yellow("exists")} ${path}`);
	} catch {
		mkdirSync(path, { recursive: true });
		if (outputLog) log.lineMessage(`${color.green("created")} ${path}`);
	}
}

export async function createFile(
	path: string,
	content: string,
	outputLog = false,
) {
	try {
		await fs.access(path);
		if (outputLog) log.lineMessage(`${color.yellow("exists")} ${path}`);
	} catch {
		writeFileSync(path, content);
		if (outputLog) log.lineMessage(`${color.green("created")} ${path}`);
	}
}

type LogWithSimpleMessage = typeof p.log & {
	lineMessage: (message?: string) => void;
};

const log: LogWithSimpleMessage = {
	...p.log,
	lineMessage: (message = "") => {
		process.stdout.write(`${color.gray("│")}  ${message}\n`);
	},
};

export const configTemplate =
	nunjucks.compile(`import { defineConfig } from "monolayer/config";

export default defineConfig({
  databases: "{{ databasePath }}",
});
`);

export const databasesTemplate =
	nunjucks.compile(`import { defineDatabase } from "monolayer/pg";
import { dbSchema } from "./schema";
import { dbSeed } from "./seed";

export default defineDatabase({
	schemas: [dbSchema],
	extensions: [],
	seeder: dbSeed,
	camelCase: false,
});
`);

export const dbTemplate =
	nunjucks.compile(`import { CamelCasePlugin, Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";
import defaultDb from "./databases";
import { type DB } from "./schema";

export const defaultDbClient = new Kysely<DB>({
	dialect: new PostgresDialect({
		pool: new Pool({ connectionString: defaultDb.connectionString}),
	}),
	plugins: defaultDb.camelCase? [new CamelCasePlugin()] : [],
});
`);

export const schemaTemplate =
	nunjucks.compile(`import { schema } from "monolayer/pg";

export const dbSchema = schema({});

export type DB = typeof dbSchema.infer;
`);

export const seedTemplate =
	nunjucks.compile(`import { sql, type Kysely } from "kysely";
import type { DB } from "./schema";

export async function dbSeed(db: Kysely<DB>) {
  const currentDatabase = await sql<{
    current_database: string;
  }>\`SELECT CURRENT_DATABASE()\`.execute(db);

  console.log("Current database:", currentDatabase.rows[0].current_database);
}
`);
