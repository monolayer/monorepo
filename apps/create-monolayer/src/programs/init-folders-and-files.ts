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
				path.join(cwd(), "monolayer.ts"),
				configTemplate.render({
					databasePath: path.join(dbFolderPath, "databases.ts"),
					seedPath: path.join(dbFolderPath, "seed.ts"),
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

			const nextSteps = `1) Edit the default configuration in \`${path.join(dbFolderPath, "databases.ts")}\`.
2) Run \`npx monolayer db:create\` to create the database.
3) Edit the schema file at \`${path.join(dbFolderPath, "schema.ts")}\`.
4) Run 'npx monolayer generate' to create migrations.
5) Run 'npx monolayer migrate' to migrate the database.`;
			p.note(nextSteps, "Next Steps");
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
  entryPoints: {
	  databases: "{{ databasePath }}",
		seed: "{{ seedPath }}",
	},
});
`);

export const databasesTemplate =
	nunjucks.compile(`import { defineDatabase } from "monolayer/pg";
import { dbSchema } from "./schema";

export default defineDatabase({
	id: "default",
	schemas: [dbSchema],
	extensions: [],
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

export async function seed(db: Kysely<DB>) {
  const currentDatabase = await sql<{
    current_database: string;
  }>\`SELECT CURRENT_DATABASE()\`.execute(db);

  console.log("Current database:", currentDatabase.rows[0].current_database);
}
`);
