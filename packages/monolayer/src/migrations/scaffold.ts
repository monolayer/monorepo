import { Effect } from "effect";
import { mkdirSync } from "fs";
import nunjucks from "nunjucks";
import path from "path";
import { createFile } from "~/create-file.js";
import { appEnvironmentMigrationsFolder } from "~/state/app-environment.js";
import { ChangesetPhase } from "../changeset/types.js";
import { migrationName } from "./migration.js";
import { dateStringWithMilliseconds } from "./render.js";

export function scaffoldMigration(
	migrationPhase: ChangesetPhase.Alter | ChangesetPhase.Data,
) {
	return Effect.gen(function* () {
		const name = yield* migrationName();
		const dateStr = dateStringWithMilliseconds();
		const scaffoldName = `${dateStr}-${name}`;
		const filePath = path.join(
			yield* appEnvironmentMigrationsFolder,
			migrationPhase,
			`${scaffoldName}.ts`,
		);
		mkdirSync(path.dirname(filePath), { recursive: true });
		const content = nunjucks.compile(migrationTemplate).render({
			name: scaffoldName,
		});
		createFile(filePath, content, true);

		return filePath;
	});
}

const migrationTemplate = `import { Kysely } from "kysely";
import { Migration } from "monolayer/migration";

export const migration: Migration = {
  name: "{{ name }}",
  transaction: false,
  scaffold: true,
};

export async function up(db: Kysely<any>): Promise<void> {
}

export async function down(db: Kysely<any>): Promise<void> {
}`;
