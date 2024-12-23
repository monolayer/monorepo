import { programWithContextAndServices } from "@monorepo/db/cli-action.js";
import { PgDatabase, type PgDatabaseConfig } from "@monorepo/pg/database.js";
import { extension } from "@monorepo/pg/schema/extension.js";
import { DbClients } from "@monorepo/services/db-clients.js";
import { type AppEnv } from "@monorepo/state/app-environment.js";
import { Effect } from "effect";
import { generators } from "~push/changeset/generators.js";
import { ChangesetPhase } from "~push/changeset/types/changeset.js";
import { pushDb } from "~push/push-db.js";
import { ChangesetGeneratorState } from "~push/state/changeset-generator.js";
import { MigrationOpsGeneratorsState } from "~push/state/migration-ops-generators.js";
import { RenameState, type Renames } from "~push/state/rename.js";
import { programWithErrorCause } from "~tests/__setup__/helpers/run-program.js";
import { globalPool, type TestContext } from "../setup.js";

export async function pushSchema({
	context,
	configuration,
	renames,
	phases,
	mock = () => true,
}: {
	context: TestContext;
	configuration: PgDatabaseConfig;
	renames?: Renames;
	phases: (
		| ChangesetPhase.Expand
		| ChangesetPhase.Alter
		| ChangesetPhase.Contract
	)[];
	mock?: () => void;
}) {
	const env: AppEnv = testAppEnv(configuration);
	env.currentWorkingDir = context.testDir;

	mock();

	return runPushDev({
		env,
		context,
		renames,
		phases,
		queryLog: context.queryLog,
	});
}

async function runPushDev(opts: {
	env: AppEnv;
	context: TestContext;
	renames?: Renames;
	phases: (
		| ChangesetPhase.Expand
		| ChangesetPhase.Alter
		| ChangesetPhase.Contract
	)[];
	queryLog: string[];
}) {
	return Effect.runPromise(
		MigrationOpsGeneratorsState.provide(
			ChangesetGeneratorState.provide(
				RenameState.provide(
					programWithErrorCause(
						programWithContextAndServices(
							pushDb(true),
							opts.env,
							DbClients.TestLayer(
								globalPool(),
								opts.context.databaseName,
								opts.env.currentDatabase.camelCase,
								opts.queryLog,
							),
						),
					),
					opts.renames ? opts.renames : {},
				),
			),
			generators,
		),
	);
}

function testAppEnv(configuration: PgDatabaseConfig) {
	return {
		databases: "databases.ts",
		currentDatabase: new PgDatabase({
			id: "default",
			schemas: configuration.schemas,
			camelCase: configuration.camelCase ?? false,
			extensions: configuration.extensions ?? [extension("plv8")],
		}),
	};
}
