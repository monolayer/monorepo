import * as p from "@clack/prompts";
import { Effect } from "effect";
import { promises as fs, mkdirSync, writeFileSync } from "fs";
import nunjucks from "nunjucks";
import path from "path";
import color from "picocolors";
import { cwd } from "process";

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
			path.join(cwd(), "yount.config.ts"),
			configTemplate.render({ folder: folder.path }),
			true,
		);
		await createDir(folder.path, true);
		await createFile(`${folder.path}/schema.ts`, schemaTemplate.render(), true);
		await createFile(
			`${folder.path}/connections.ts`,
			connectionsTemplate.render(),
			true,
		);
		await createFile(`${folder.path}/seed.ts`, seedTemplate.render(), true);
		await createDir(`${folder.path}/migrations`, true);

		const nextSteps = `1) Edit the database connection details at \`yount.config.ts\`.
2) Run \`npx yount db:create\` to create the database.
3) Edit the schema file at \`${path.join(folder.path, "schema.ts")}\`.
4) Run 'npx yount generate' to create migrations.
5) Run 'npx yount migrate' to migrate the database.`;
		p.note(nextSteps, "Next Steps");
	});
}

export const configTemplate =
	nunjucks.compile(`import type { YountConfig } from "yount/config";

const config = {
	folder: "{{ folder }}"
} satisfies YountConfig;

export default config;
`);

export const connectionsTemplate =
	nunjucks.compile(`import { Kysely } from "kysely";
	import { kyselyConfig, type Connections } from "yount/config";
	import { database, type DB } from "./schema";

export const connections = {
	default: {
		schemas: [database],
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
		},
		camelCasePlugin: {
      enabled: false,
    },
	},
} satisfies Connections;

export const defaultDb = new Kysely<DB>(
	kyselyConfig(connections.default, process.env.APP_ENV || "development")
);
`);

export const schemaTemplate =
	nunjucks.compile(`import { pgDatabase } from "yount";

export const database = pgDatabase({});

export type DB = typeof database.infer;
`);

export const seedTemplate =
	nunjucks.compile(`import type { Kysely } from "kysely";
import type { DB } from "./schema";

export async function seed(db: Kysely<DB>){}
`);
