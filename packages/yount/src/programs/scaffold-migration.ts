import { Effect } from "effect";
import nunjucks from "nunjucks";
import path from "path";
import { randomName } from "~/revisions/random-name.js";
import { createFile } from "~/utils.js";
import { Environment } from "../services/environment.js";

export function scaffoldMigration() {
	return timestamp().pipe(
		Effect.flatMap(scaffoldMigrationPath),
		Effect.tap(generate),
	);
}

function timestamp() {
	return Effect.succeed(
		new Date().toISOString().replace(/[-:]/g, "").split(".")[0],
	);
}

function scaffoldMigrationPath(timestamp?: string) {
	return Environment.pipe(
		Effect.flatMap((environment) =>
			Effect.succeed(
				path.join(
					environment.migrationFolder,
					`${timestamp}-${randomName()}.ts`,
				),
			),
		),
	);
}

function generate(filePath: string) {
	const template = `import { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
}

export async function down(db: Kysely<any>): Promise<void> {
}`;
	createFile(filePath, nunjucks.compile(template).render(), true);
	return Effect.succeed(true);
}
