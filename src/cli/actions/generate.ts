import * as p from "@clack/prompts";
import { Kysely, PostgresDialect } from "kysely";
import pg from "pg";
import { importConfig } from "~/config.js";
import { analyzeLocalSchema } from "../components/analyze_local_schema.js";
import { analyzeRemoteSchema } from "../components/analyze_remote_schema.js";
import { computeChangeset } from "../components/compute_changeset.js";
import { generateMigrations } from "../components/generate_migrations.js";
import { pendingMigrations } from "../components/pending_migrations.js";
import {
	checkAutoPilotLock,
	checkEnvironmentIsConfigured,
} from "../utils/clack.js";

export async function generate() {
	p.intro("Generate");
	const config = await importConfig();
	const environmentConfig =
		config.environments["development" as keyof (typeof config)["environments"]];

	checkEnvironmentIsConfigured(config, "development", {
		outro: true,
	});

	checkAutoPilotLock({ outro: true });

	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
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
		config.camelCasePlugin,
	);
	const changeset = await computeChangeset(localInfo, remoteColumnInfo.result);

	await generateMigrations(changeset, config);

	kysely.destroy();

	p.outro("Done");
}
