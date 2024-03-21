import * as p from "@clack/prompts";
import { Kysely, PostgresDialect } from "kysely";
import pg from "pg";
import { importConfig } from "~/config.js";
import { analyzeLocalSchema } from "../components/analyze-local-schema.js";
import { analyzeRemoteSchema } from "../components/analyze-remote-schema.js";
import { computeChangeset } from "../components/compute-changeset.js";
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

	const remoteColumnInfo = await analyzeRemoteSchema(environmentConfig, kysely);
	const localInfo = await analyzeLocalSchema(
		config,
		remoteColumnInfo.result,
		config.camelCasePlugin ?? { enabled: false },
	);
	const changeset = await computeChangeset(localInfo, remoteColumnInfo.result);

	await generateMigrations(changeset, config);

	kysely.destroy();

	p.outro("Done");
}
