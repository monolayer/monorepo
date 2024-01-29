import path from "node:path";
import nunjucks from "nunjucks";
import { ChangeSet } from "~/database/db_changeset.js";
import { createFile } from "~/utils.js";

const template = `import { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .{{ up.join("\n    .") | safe }}
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .{{ down.join("\n    .") | safe }}
    .execute();
}
`;

export function generateMigrationFiles(changeset: ChangeSet, folder: string) {
	for (const change of changeset) {
		const now = performance.now().toFixed(1).toString().replace(".", "");
		const dateStr = new Date().toISOString().replace(/[-:]/g, "").split(".")[0];
		const migrationFilePath = path.join(
			folder,
			"migrations",
			`${dateStr}-${now}-${change.type}_${change.tableName}.ts`,
		);
		const rendered = nunjucks.compile(template).render({
			up: change.up,
			down: change.down,
		});
		createFile(migrationFilePath, rendered, true);
	}
}
