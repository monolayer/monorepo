import path from "node:path";
import nunjucks from "nunjucks";
import { ChangeSet, TableChangeSet } from "~/database/db_changeset.js";
import { createFile } from "~/utils.js";

const template = `import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
{%- if columnsUp %}
  await db.schema
    .{{ columnsUp.join("\n    .") | safe }}
    .execute();
{% endif -%}
{%- for upIndex in indexesUp %}
  {{ upIndex | safe }}
{% endfor -%}
}

export async function down(db: Kysely<any>): Promise<void> {
{%- if columnsDown %}
  await db.schema
    .{{ columnsDown.join("\n    .") | safe }}
    .execute();
{% endif -%}
{%- for downIndex in indexesDown %}
  {{ downIndex | safe }}
{% endfor -%}
}
`;

export function generateMigrationFiles(changeset: ChangeSet, folder: string) {
	const keys = Object.keys(changeset) as Array<keyof typeof changeset>;
	for (const key of keys) {
		const tableChange = changeset[key] as TableChangeSet;
		const columnChanges = tableChange.columns;
		const indexChanges = tableChange.indexes;
		const migrationType = columnChanges ? columnChanges.type : "change";
		const now = performance.now().toFixed(1).toString().replace(".", "");
		const dateStr = new Date().toISOString().replace(/[-:]/g, "").split(".")[0];
		const migrationFilePath = path.join(
			folder,
			"migrations",
			`${dateStr}-${now}-${migrationType}_${key}.ts`,
		);
		const rendered = nunjucks.compile(template).render({
			columnsUp: columnChanges ? columnChanges.up : undefined,
			columnsDown: columnChanges ? columnChanges.down : undefined,
			indexesUp: indexChanges.flatMap((idx) => idx.up),
			indexesDown: indexChanges.flatMap((idx) => idx.down).reverse(),
		});
		createFile(migrationFilePath, rendered, true);
	}
}
