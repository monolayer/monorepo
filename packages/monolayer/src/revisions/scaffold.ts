import { Effect } from "effect";
import nunjucks from "nunjucks";
import path from "path";
import { createFile } from "~/create-file.js";
import { Environment } from "../services/environment.js";
import { revisionDependency, revisionName } from "./revision.js";

export function scaffoldRevision() {
	return Effect.gen(function* (_) {
		const environment = yield* _(Environment);
		const name = yield* _(revisionName());
		const timestamp = new Date()
			.toISOString()
			.replace(/[-:]/g, "")
			.split(".")[0];
		const filePath = path.join(
			environment.schemaRevisionsFolder,
			`${timestamp}-${name}.ts`,
		);

		const content = nunjucks
			.compile(revisionTemplate)
			.render({ dependsOn: yield* _(revisionDependency()) });
		createFile(filePath, content, true);

		return filePath;
	});
}

const revisionTemplate = `import { Kysely } from "kysely";
{%- if dependsOn === "NO_DEPENDENCY" %}
import { NO_DEPENDENCY, Revision } from "monolayer/revision";
{%- else %}
import { Revision } from "monolayer/revision";
{%- endif %}

export const revision: Revision = {
	scaffold: true,
	dependsOn: {{ dependsOn if dependsOn === "NO_DEPENDENCY" else ['"', dependsOn, '"'] | join("") | safe }},
};

export async function up(db: Kysely<any>): Promise<void> {
}

export async function down(db: Kysely<any>): Promise<void> {
}`;
