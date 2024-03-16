import path from "node:path";
import nunjucks from "nunjucks";
import { createFile } from "~/utils.js";
import { Changeset } from "../changeset/migration_op/changeset.js";
import { randomName } from "./random_name.js";

const template = `import { Kysely, sql } from "kysely";

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

export function generateMigrationFiles(
	changesets: Changeset[],
	folder: string,
	migrationsFolder = "migrations",
	name?: string,
	log = true,
) {
	const { up, down } = extractMigrationOpChangesets(changesets);
	const dateStr = new Date().toISOString().replace(/[-:]/g, "").split(".")[0];
	const migrationFilePath = path.join(
		folder,
		migrationsFolder,
		name !== undefined ? name : `${dateStr}-${randomName()}.ts`,
	);
	const rendered = nunjucks.compile(template).render({
		up: up,
		down: down,
	});
	createFile(
		migrationFilePath,
		rendered.includes("sql`") ? rendered : rendered.replace(", sql", ""),
		log,
	);
}

function extractMigrationOpChangesets(changesets: Changeset[]) {
	const up = changesets
		.filter(
			(changeset) =>
				changeset.up.length > 0 && (changeset.up[0] || []).length > 0,
		)
		.map((changeset) => changeset.up.map((u) => u.join("\n    .")).join("\n"));
	const down = changesets
		.reverse()
		.filter(
			(changeset) =>
				changeset.down.length > 0 && (changeset.down[0] || []).length > 0,
		)
		.map((changeset) =>
			changeset.down.map((d) => d.join("\n    .")).join("\n"),
		);
	return { up, down };
}
