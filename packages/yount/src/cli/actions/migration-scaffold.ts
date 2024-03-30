import * as p from "@clack/prompts";
import nunjucks from "nunjucks";
import path from "path";
import { importConfig } from "~/config.js";
import { randomName } from "~/migrations/random-name.js";
import { createFile } from "~/utils.js";

const template = `import { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
}

export async function down(db: Kysely<any>): Promise<void> {
}`;

export async function migrationScaffold() {
	p.intro("Migration Scaffold");
	const config = await importConfig();

	const dateStr = new Date().toISOString().replace(/[-:]/g, "").split(".")[0];

	const migrationFilePath = path.join(
		config.folder,
		"migrations",
		`${dateStr}-${randomName()}.ts`,
	);

	createFile(migrationFilePath, nunjucks.compile(template).render(), true);

	p.outro("Done");
}
