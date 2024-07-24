import { Effect } from "effect";
import { mkdirSync } from "fs";
import nunjucks from "nunjucks";
import path from "path";
import { createFile } from "~/create-file.js";
import { appEnvironmentMigrationsFolder } from "~/state/app-environment.js";
import { Migrator } from "../services/migrator.js";
import { migrationName } from "./migration.js";
import { dateStringWithMilliseconds } from "./render.js";

export function scaffoldMigration() {
	return Effect.gen(function* () {
		const name = yield* migrationName();
		const dateStr = dateStringWithMilliseconds();
		const scaffoldName = `${dateStr}-${name}`;
		const filePath = path.join(
			yield* appEnvironmentMigrationsFolder,
			"breaking",
			`${scaffoldName}.ts`,
		);
		const migrator = yield* Migrator;
		mkdirSync(path.dirname(filePath), { recursive: true });
		const content = nunjucks.compile(migrationTemplate).render({
			dependsOn: yield* migrator.currentDependency,
			name: scaffoldName,
		});
		createFile(filePath, content, true);

		return filePath;
	});
}

const migrationTemplate = `import { Kysely } from "kysely";
{%- if dependsOn === "NO_DEPENDENCY" %}
import { NO_DEPENDENCY, Migration } from "monolayer/migration";
{%- else %}
import { Migration } from "monolayer/migration";
{%- endif %}

export const migration: Migration = {
  name: "{{ name }}",
  transaction: false,
  scaffold: true,
  dependsOn: {{ dependsOn if dependsOn === "NO_DEPENDENCY" else ['"', dependsOn, '"'] | join("") | safe }},
};

export async function up(db: Kysely<any>): Promise<void> {
}

export async function down(db: Kysely<any>): Promise<void> {
}`;
