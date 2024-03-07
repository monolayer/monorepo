import path from "node:path";
import nunjucks from "nunjucks";
import { createFile } from "~/utils.js";
import { Changeset } from "../migration_op/changeset.js";

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
		true,
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

function randomName() {
	const randomColor = colors[Math.floor(Math.random() * colors.length)];
	const randomStarName =
		starNames[Math.floor(Math.random() * starNames.length)];
	return `${randomStarName}-${randomColor}`;
}

const colors = [
	"crimson",
	"sapphire",
	"emerald",
	"amethyst",
	"canary",
	"charcoal",
	"coral",
	"turquoise",
	"lavender",
	"olive",
	"teal",
	"maroon",
	"mustard",
	"slate",
	"cobalt",
	"magenta",
	"mint",
	"indigo",
	"peach",
	"blue",
	"yellow",
	"red",
	"green",
	"gray",
	"black",
];

const starNames = [
	"sirius",
	"canopus",
	"arcturus",
	"vega",
	"rigel",
	"procyon",
	"achernar",
	"altair",
	"antares",
	"spica",
	"pollux",
	"fomalhaut",
	"deneb",
	"regulus",
	"castor",
	"gacrux",
	"bellatrix",
	"algol",
	"mizar",
	"alnilam",
	"alnair",
	"dubhe",
	"mirfak",
	"alphard",
	"polaris",
	"diphda",
	"schedar",
	"caph",
	"algenib",
	"mirach",
	"alpheratz",
	"hamal",
	"electra",
	"maia",
	"merope",
	"taygeta",
	"pleione",
];
