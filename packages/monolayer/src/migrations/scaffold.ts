import { Effect } from "effect";
import nunjucks from "nunjucks";
import path from "path";
import { createFile } from "~/create-file.js";
import { Environment } from "../services/environment.js";
import { migrationDependency, migrationName } from "./migration.js";

export function scaffoldMigration() {
	return Effect.gen(function* () {
		const environment = yield* Environment;
		const name = yield* migrationName();
		const timestamp = new Date()
			.toISOString()
			.replace(/[-:]/g, "")
			.split(".")[0];
		const filePath = path.join(
			environment.schemaMigrationsFolder,
			`${timestamp}-${name}.ts`,
		);

		const content = nunjucks
			.compile(migrationTemplate)
			.render({ dependsOn: yield* migrationDependency() });
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
	scaffold: true,
	dependsOn: {{ dependsOn if dependsOn === "NO_DEPENDENCY" else ['"', dependsOn, '"'] | join("") | safe }},
};

export async function up(db: Kysely<any>): Promise<void> {
}

export async function down(db: Kysely<any>): Promise<void> {
}`;
