import path from "path";
import * as p from "@clack/prompts";
import nunjucks from "nunjucks";
import { cwd } from "process";
import { log } from "../utils/clack.js";
import { createDir, createFile } from "./file.js";

export async function initFolderAndFiles() {
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
		path.join(cwd(), "kinetic.ts"),
		configTemplate.render({ folder: folder.path }),
		true,
	);
	await createDir(folder.path, true);
	await createFile(`${folder.path}/schema.ts`, schemaTemplate.render(), true);
	await createDir(`${folder.path}/migrations`, true);

	await createFile(
		path.join(`${folder.path}/kysely.ts`),
		kyselyTemplate.render({
			kineticConfigPath: path.relative(
				path.join(cwd(), folder.path),
				path.join(cwd(), "kinetic.js"),
			),
		}),
		true,
	);
}

export const configTemplate = nunjucks.compile(`import type { Config } from "kysely-kinetic";

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

export const schemaTemplate = nunjucks.compile(`import { pgDatabase } from "kysely-kinetic";

export const database = pgDatabase({});

export type DB = typeof database.kyselyDatabase;
`);

export const kyselyTemplate = nunjucks.compile(`import { Kysely, PostgresDialect } from "kysely";
import { pgPool } from "kysely-kinetic";
import kineticConfig from "{{ kineticConfigPath }}";
import type { DB } from "./schema.js";

export const kysely = new Kysely<DB>({
	dialect: new PostgresDialect({
		pool: pgPool(kineticConfig, process.env.KINETIC_ENV || "development"),
	}),
});
`);
