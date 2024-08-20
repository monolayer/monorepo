import { ChangesetPhase } from "@monorepo/pg/changeset/types.js";
import { appEnvironmentMigrationsFolder } from "@monorepo/state/app-environment.js";
import { createFile } from "@monorepo/utils/create-file.js";
import { Effect } from "effect";
import { mkdirSync } from "fs";
import nunjucks from "nunjucks";
import path from "path";
import { migrationNamePrompt } from "~programs/migration-name.js";
import { dateStringWithMilliseconds } from "~programs/render.js";

export function scaffoldMigration(
	migrationPhase: ChangesetPhase,
	transaction?: boolean,
) {
	return Effect.gen(function* () {
		const name = yield* migrationNamePrompt();
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
			transaction,
		});
		createFile(filePath, content, true);

		return filePath;
	});
}

const migrationTemplate = `import { Kysely } from "kysely";
import { type Migration } from "monolayer/migration";

export const migration: Migration = {
  name: "{{ name }}",
  transaction: {{ transaction }},
  scaffold: true,
};

export async function up(db: Kysely<any>): Promise<void> {
}

export async function down(db: Kysely<any>): Promise<void> {
}`;
