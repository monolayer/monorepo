import path from "node:path";
import nunjucks from "nunjucks";
import { Changeset } from "~/changeset/types.js";
import { createFile } from "~/create-file.js";

const template = `/* eslint-disable @typescript-eslint/no-explicit-any */
import { Kysely, sql } from "kysely";
{%- if dependsOn === "NO_DEPENDENCY" %}
import { NO_DEPENDENCY } from "yount/revision";
{%- endif %}

export const dependsOn = {{ dependsOn if dependsOn === "NO_DEPENDENCY" else ['"', dependsOn, '"'] | join("") | safe }};

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

export function createSchemaRevision(
	changesets: Changeset[],
	folder: string,
	name: string,
	dependsOn: string,
) {
	const { up, down } = extractRevisionOps([...changesets]);
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

function extractRevisionOps(changesets: Changeset[]) {
	const up = changesets
		.filter(
			(changeset) =>
				changeset.up.length > 0 && (changeset.up[0] || []).length > 0,
		)
		.map((changeset) =>
			changeset.up.map((u) => u.join("\n    .")).join("\n\n  "),
		);
	const down = reverseChangeset(changesets)
		.filter(
			(changeset) =>
				changeset.down.length > 0 && (changeset.down[0] || []).length > 0,
		)
		.map((changeset) =>
			changeset.down.map((d) => d.join("\n    .")).join("\n\n  "),
		);
	return { up, down };
}

function reverseChangeset(changesets: Changeset[]) {
	const itemsToMaintain = changesets.filter(
		(changeset) =>
			changeset.type === "createTable" || changeset.type === "dropTable",
	);

	const itemsToReverse = changesets.filter(
		(changeset) =>
			changeset.type !== "createTable" && changeset.type !== "dropTable",
	);

	return [...itemsToMaintain, ...itemsToReverse.reverse()].sort((a, b) => {
		if (a.priority !== 0 && a.tableName === "none" && b.tableName !== "none") {
			return -1;
		}
		return 1 - 1;
	});
}
