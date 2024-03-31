import * as p from "@clack/prompts";
import { Effect } from "effect";
import { promises as fs, mkdirSync, writeFileSync } from "fs";
import nunjucks from "nunjucks";
import path from "path";
import color from "picocolors";
import { cwd } from "process";

export async function createDir(
	path: string,
	outputLog = false,
): Promise<void> {
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
): Promise<void> {
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

export function initFolderAndFiles() {
	return Effect.tryPromise(async () => {
		const folder = await p.group(
			{
				path: () =>
					p.text({
						message: "Where should the db folder be created?",
						placeholder: "app/db",
						defaultValue: "app/db",
						validate: (value) => {
							let path = value;
							if (path === "") path = "app/db";
							if (path[0] === "/") return "Please enter a relative path.";
						},
					}),
			},
			{
				onCancel: () => {
					p.cancel("Operation cancelled.");
					process.exit(0);
				},
			},
		);

		log.lineMessage("");

		await createFile(
			path.join(cwd(), "yount.ts"),
			configTemplate.render({ folder: folder.path }),
			true,
		);
		await createDir(folder.path, true);
		await createFile(`${folder.path}/schema.ts`, schemaTemplate.render(), true);
		await createFile(`${folder.path}/seed.ts`, seedTemplate.render(), true);
		await createDir(`${folder.path}/migrations`, true);

		await createFile(
			path.join(`${folder.path}/db.ts`),
			yountTemplate.render({
				yountConfigPath: path.relative(
					path.join(cwd(), folder.path),
					path.join(cwd(), "yount"),
				),
			}),
			true,
		);
	});
}

export const configTemplate =
	nunjucks.compile(`import type { Config } from "yount/config";

export default ({
  folder: "{{ folder }}",
  environments: {
    development: {
      database: "#database_development",
      user: "#user",
      password: "#password",
      host: "#host",
      port: 5432
    },
    test: {
      database: "#database_test",
      user: "#user",
      password: "#password",
      host: "#host",
      port: 5432
    },
    production: {
      connectionString: process.env.DATABASE_URL,
    }
  }
} satisfies Config);`);

export const schemaTemplate =
	nunjucks.compile(`import { pgDatabase } from "yount";

export const database = pgDatabase({});

export type DB = typeof database.infer;
`);

export const yountTemplate =
	nunjucks.compile(`import { Kysely, PostgresDialect } from "kysely";
import { pgPool } from "yount/pool";
import yountConfig from "{{ yountConfigPath }}";
import type { DB } from "./schema.js";

export const db = new Kysely<DB>({
	dialect: new PostgresDialect({
		pool: pgPool(yountConfig, process.env.KINETIC_ENV || "development"),
	}),
});
`);

export const seedTemplate =
	nunjucks.compile(`import type { Kysely } from "kysely";
import type { DB } from "./schema.js";

export async function seed(db: Kysely<DB>){}
`);
