import { createFile } from "@monorepo/utils/create-file.js";
import path from "node:path";
import nunjucks from "nunjucks";
const template = `import { Kysely, sql } from "kysely";
import { type Migration{% if splitColumnRefactor %}, SplitColumnRefactor{% endif %} } from "monolayer/migration";

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
	splitColumnRefactor: boolean,
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
		splitColumnRefactor,
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
