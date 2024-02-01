import path from "node:path";
import nunjucks from "nunjucks";
import { Changeset } from "~/database/changeset.js";
import { createFile } from "~/utils.js";

const template = `import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
{%- for u in up %}
  {{ u | safe }}
{% endfor -%}
}

export async function down(db: Kysely<any>): Promise<void> {
{%- for d in down %}
  {{ d | safe }}
{% endfor -%}
}
`;

export function generateMigrationFiles(
	changesets: Changeset[],
	folder: string,
	name: string,
) {
	const { up, down } = extractMigrationOpChangesets(changesets);
	const now = performance.now().toFixed(1).toString().replace(".", "");
	const dateStr = new Date().toISOString().replace(/[-:]/g, "").split(".")[0];
	const migrationFilePath = path.join(
		folder,
		"migrations",
		`${dateStr}-${now}-${name}.ts`,
	);
	const rendered = nunjucks.compile(template).render({
		up: up,
		down: down,
	});
	createFile(migrationFilePath, rendered, true);
}

function extractMigrationOpChangesets(changesets: Changeset[]) {
	const up = changesets
		.filter((changeset) => changeset.up.length > 0)
		.map((changeset) => changeset.up.join("\n    ."));
	const down = changesets
		.filter((changeset) => changeset.down.length > 0)
		.map((changeset) => changeset.down.join("\n    ."));
	return { up, down };
}
