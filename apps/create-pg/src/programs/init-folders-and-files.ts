import { fail, gen, tryPromise } from "effect/Effect";
import { appendFileSync, promises as fs, mkdirSync, writeFileSync } from "fs";
import nunjucks from "nunjucks";
import ora from "ora";
import path from "path";
import color from "picocolors";
import { cwd } from "process";
import { DbFolderState, UndefinedDbFolderError } from "../state/db-folder.js";

function createFileFromTemplate(
	banner: string,
	content: string,
	relativePath: string,
) {
	return gen(function* () {
		const spinner = ora();
		spinner.start(banner);
		const result = yield* tryPromise(() =>
			createFile(path.join(cwd(), relativePath), content),
		);
		switch (result) {
			case "exists":
				spinner.succeed(`${banner} ${color.yellow("exists")}`);
				break;
			case "created":
				spinner.succeed();
				break;
		}
	});
}

export const initFolderAndFiles = gen(function* () {
	const dbFolder = yield* DbFolderState.current;
	const dbFolderPath = dbFolder?.path;
	if (dbFolderPath === undefined) {
		yield* fail(new UndefinedDbFolderError());
	} else {
		yield* createFileFromTemplate(
			"Create monolayer.config.ts",
			configTemplate.render({
				databasePath: path.join(dbFolderPath, "databases.ts"),
			}),
			"monolayer.config.ts",
		);
		yield* tryPromise(() => createDir(dbFolderPath));
		yield* createFileFromTemplate(
			`Create ${dbFolderPath}/databases.ts`,
			databasesTemplate.render(),
			`${dbFolderPath}/databases.ts`,
		);
		yield* createFileFromTemplate(
			`Create ${dbFolderPath}/schema.ts`,
			schemaTemplate.render(),
			`${dbFolderPath}/schema.ts`,
		);
		yield* createFileFromTemplate(
			`Create ${dbFolderPath}/client.ts`,
			dbTemplate.render(),
			`${dbFolderPath}/client.ts`,
		);
		yield* createFileFromTemplate(
			`Create ${dbFolderPath}/seed.ts`,
			seedTemplate.render(),
			`${dbFolderPath}/seed.ts`,
		);
		yield* createOrAppendDatabaseURL();
	}
});

export async function createDir(path: string) {
	try {
		await fs.access(path);
	} catch {
		mkdirSync(path, { recursive: true });
	}
}

export async function createFile(path: string, content: string) {
	try {
		await fs.access(path);
		return "exists";
	} catch {
		writeFileSync(path, content);
		return "created";
	}
}

export const configTemplate =
	nunjucks.compile(`import { defineConfig } from "@monolayer/pg/config";

export default defineConfig({
  databases: "{{ databasePath }}",
});
`);

export const databasesTemplate =
	nunjucks.compile(`import { defineDatabase } from "@monolayer/pg/schema";
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
import pg from "pg";
import defaultDb from "./databases";
import { type DB } from "./schema";
import dotenv from "dotenv";
dotenv.config({});

export const defaultDbClient = new Kysely<DB>({
  dialect: new PostgresDialect({
    pool: new pg.Pool({
      connectionString: defaultDb.connectionString,
    }),
  }),
  plugins: defaultDb.camelCase ? [new CamelCasePlugin()] : [],
});
`);

export const schemaTemplate =
	nunjucks.compile(`import { schema } from "@monolayer/pg/schema";

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

  console.log("Current database:", currentDatabase.rows[0]?.current_database);
}
`);

const databaseURL = `

# Inserted by \`@monolayer/create-pg\`
# MONO_PG_DEFAULT_DATABASE_URL=postgresql://user:password@dbserver:5432/dbName
`;

function createOrAppendDatabaseURL() {
	return gen(function* () {
		const banner = "Add sample environment variable to .env";
		const spinner = ora();
		spinner.start(banner);
		const exists = yield* tryPromise(async () => {
			try {
				await fs.access(".env");
				return true;
			} catch {
				return false;
			}
		});
		if (exists) {
			appendFileSync(".env", databaseURL);
		} else {
			writeFileSync(".env", databaseURL);
		}
		spinner.succeed();
	});
}
