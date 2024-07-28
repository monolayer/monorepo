import path from "node:path";
import nunjucks from "nunjucks";
import { createFile } from "~/create-file.js";

const template = `/* eslint-disable @typescript-eslint/no-explicit-any */
import { Kysely, sql } from "kysely";
import { Migration } from "monolayer/migration";

export const migration: Migration = {
	name: "{{ name }}",
	transaction: {{ transaction | safe }},
	scaffold: false,
	warnings: {{ warnings | safe}}
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
	transaction: boolean,
	warnings: string,
) {
	const { up, down } = upDown;
	const dateStr = dateStringWithMilliseconds();
	const migrationName = `${dateStr}-${name}`;
	const migrationFilePath = path.join(folder, `${migrationName}.ts`);
	const rendered = nunjucks.compile(template).render({
		up: up,
		down: down,
		transaction,
		name: migrationName,
		warnings,
	});

	createFile(
		migrationFilePath,
		rendered.includes("sql`") ? rendered : rendered.replace(", sql", ""),
		false,
	);
	return migrationName;
}

export function dateStringWithMilliseconds() {
	return new Date()
		.toISOString()
		.replace(/[-:]/g, "")
		.replace(".", "")
		.replace("T", "")
		.replace("Z", "");
}
