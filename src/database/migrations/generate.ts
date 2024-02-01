import path from "node:path";
import nunjucks from "nunjucks";
import { ChangeSetType, Changeset, DbChangeset } from "~/database/changeset.js";
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

export function generateMigrationFiles(changeset: DbChangeset, folder: string) {
	const keys = Object.keys(changeset);
	for (const key of keys) {
		const changesets = changeset[key] as Changeset[];
		const { up, down } = extractMigrationOpChangesets(changesets);

		const now = performance.now().toFixed(1).toString().replace(".", "");
		const dateStr = new Date().toISOString().replace(/[-:]/g, "").split(".")[0];
		const migrationFilePath = path.join(
			folder,
			"migrations",
			`${dateStr}-${now}-${migrationType(changesets)}_${key}.ts`,
		);

		const rendered = nunjucks.compile(template).render({
			up: up,
			down: down,
		});
		createFile(migrationFilePath, rendered, true);
	}
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

function migrationType(changesets: Changeset[]) {
	const types = changesets.map((changeset) => changeset.type);
	if (types.includes(ChangeSetType.CreateTable)) return "create";
	if (types.includes(ChangeSetType.DropTable)) return "drop";
	return "change";
}
