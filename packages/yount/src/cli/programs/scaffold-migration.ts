import { Effect } from "effect";
import nunjucks from "nunjucks";
import path from "path";
import { randomName } from "~/migrations/random-name.js";
import { createFile } from "~/utils.js";
import { Environment } from "../services/environment.js";

const template = `import { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
}

export async function down(db: Kysely<any>): Promise<void> {
}`;

export function scaffoldMigration() {
	return Effect.gen(function* (_) {
		const environment = yield* _(Environment);
		const dateStr = new Date().toISOString().replace(/[-:]/g, "").split(".")[0];
		const migrationFilePath = path.join(
			environment.config.migrationFolder,
			`${dateStr}-${randomName()}.ts`,
		);
		createFile(migrationFilePath, nunjucks.compile(template).render(), true);
	});
}
