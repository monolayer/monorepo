import path from "node:path";
import nunjucks from "nunjucks";
import { createFile } from "~/create-file.js";

const template = `/* eslint-disable @typescript-eslint/no-explicit-any */
import { Kysely, sql } from "kysely";
{%- if dependsOn === "NO_DEPENDENCY" %}
import { NO_DEPENDENCY, Migration } from "monolayer/migration";
{%- else %}
import { Migration } from "monolayer/migration";
{%- endif %}

export const migration: Migration = {
	scaffold: false,
	dependsOn: {{ dependsOn if dependsOn === "NO_DEPENDENCY" else ['"', dependsOn, '"'] | join("") | safe }},
};

export async function up(db: Kysely<any>): Promise<void> {
{%- for u in up %}
  {{ u | safe }}
{% endfor -%}
}

export async function down(db: Kysely<any>): Promise<void> {
{%- for downOps in down %}
  {{ downOps | safe }}
{% endfor -%}
}
`;

export function renderToFile(
	upDown: {
		up: string[];
		down: string[];
	},
	folder: string,
	name: string,
	dependsOn: string,
) {
	const { up, down } = upDown;
	const dateStr = new Date().toISOString().replace(/[-:]/g, "").split(".")[0];
	const migrationFilePath = path.join(folder, `${dateStr}-${name}.ts`);
	const rendered = nunjucks.compile(template).render({
		up: up,
		down: down,
		dependsOn,
	});
	createFile(
		migrationFilePath,
		rendered.includes("sql`") ? rendered : rendered.replace(", sql", ""),
		false,
	);
}
