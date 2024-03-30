import * as p from "@clack/prompts";
import { Kysely, PostgresDialect } from "kysely";
import pg from "pg";
import color from "picocolors";
import { exit } from "process";
import { changeset } from "~/changeset/changeset.js";
import { importConfig, importSchema } from "~/config.js";
import { localSchema, remoteSchema } from "~/introspection/introspection.js";
import { ActionStatus } from "../command.js";
import { generateMigrations } from "../components/generate-migrations.js";
import { pendingMigrations } from "../components/pending-migrations.js";
import { checkEnvironmentIsConfigured } from "../utils/clack.js";

export async function generate() {
	p.intro("Generate");
	const config = await importConfig();
	const environmentConfig = checkEnvironmentIsConfigured(
		config,
		"development",
		{
			outro: true,
		},
	);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const kysely = new Kysely<any>({
		dialect: new PostgresDialect({
			pool: new pg.Pool(environmentConfig),
		}),
	});

	await pendingMigrations(config, kysely);

	const remoteColumnInfo = await remoteSchema(kysely);
	if (remoteColumnInfo.status === ActionStatus.Error) {
		console.error(remoteColumnInfo.error);
		exit(1);
	}

	const localSchemaFile = await importSchema();
	if (localSchemaFile.database === undefined) {
		p.log.warning(
			`Nothing to do. No database schema exported at ${config.folder}/schema.ts.`,
		);
		p.outro("Done");
		exit(0);
	}

	const localInfo = localSchema(
		localSchemaFile.database,
		remoteColumnInfo.result,
		config.camelCasePlugin ?? { enabled: false },
	);

	const cset = changeset(localInfo, remoteColumnInfo.result);

	if (cset.length === 0) {
		p.outro(`${color.green("Nothing to do")}. No schema changes found.`);
		exit(0);
	}

	await generateMigrations(cset, config);

	kysely.destroy();

	p.outro("Done");
}
