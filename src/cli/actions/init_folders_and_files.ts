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
		path.join(cwd(), ".kinetic.ts"),
		configTemplate.render({ folder: folder.path }),
		true,
	);
	await createDir(folder.path, true);
	await createFile(`${folder.path}/schema.ts`, schemaTemplate.render(), true);
	await createDir(`${folder.path}/migrations`, true);
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

export const schemaTemplate = nunjucks.compile(`import { registerSchema } from "kysely-kinetic";

registerSchema({});
`);
