import { ChangesetGeneratorState } from "@monorepo/pg/changeset/changeset-generator.js";
import {
	MonoLayerPgDatabase,
	type DatabaseConfig,
} from "@monorepo/pg/database.js";
import { generateMigration } from "@monorepo/programs/migrations/generate.js";
import { TableRenameState } from "@monorepo/programs/table-renames.js";
import { DbClients } from "@monorepo/services/db-clients.js";
import { Migrator } from "@monorepo/services/migrator.js";
import {
	AppEnvironment,
	type AppEnv,
} from "@monorepo/state/app-environment.js";
import type { TableRename } from "@monorepo/state/table-column-rename.js";
import { Effect } from "effect";
import type { Layer } from "effect/Layer";
import path from "path";
import { expect } from "vitest";
import { programWithContextAndServices } from "~monolayer/cli-action.js";
import type { DbContext } from "~tests/__setup__/helpers/kysely.js";
import { testLayers } from "~tests/__setup__/helpers/layers.js";
import { migrateDown as migrateDownProgram } from "~tests/__setup__/helpers/migrate-down.js";
import { programWithErrorCause } from "~tests/__setup__/helpers/run-program.js";

export async function testChangesetAndMigrations({
	context,
	configuration,
	expected,
	down,
	tableRenames = [] as TableRename[],
	mock = () => true,
}: {
	context: DbContext;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	expected: any[];
	down: "same" | "reverse" | "empty";
	configuration: DatabaseConfig;
	tableRenames?: TableRename[];
	mock?: () => void;
}) {
	const env: AppEnv = {
		entryPoints: {
			databases: "databases.ts",
		},
		database: new MonoLayerPgDatabase({
			id: "default",
			schemas: configuration.schemas,
			camelCase: configuration.camelCase ?? false,
			extensions: configuration.extensions ?? [],
		}),
	};
	const layers = testLayers(
		context.dbName,
		path.join(context.folder, "migrations", "default"),
		env.database,
	);

	mock();

	const result = await runGenerateChangesetMigration(layers, env, tableRenames);

	expect(result).toEqual(expected);

	const migrationResult = await runMigrate(layers, env);
	expect(migrationResult).toBe(true);

	const afterUpCs = await runGenerateChangesetMigration(layers, env);
	expect(afterUpCs).toEqual([]);

	const migrateDownResult = await runMigrateDown(layers, env);
	expect(migrateDownResult).toBe(true);

	mock();

	switch (down) {
		case "reverse": {
			const afterDownCs = await runGenerateChangesetMigration(
				layers,
				env,
				tableRenames,
			);
			expect(afterDownCs).toEqual(
				result
					.reverse()
					.filter((changeset) => changeset.type !== "createSchema"),
			);
			break;
		}
		case "same": {
			const afterDownCs = await runGenerateChangesetMigration(
				layers,
				env,
				tableRenames,
			);
			expect(afterDownCs).toEqual(result);
			break;
		}
		case "empty": {
			const afterDownCs = await runGenerateChangesetMigration(
				layers,
				env,
				tableRenames,
			);
			expect(afterDownCs).toEqual([]);
			break;
		}
	}
	await cleanup(layers, env);
}

async function runGenerateChangesetMigration(
	layers: Layer<Migrator | DbClients, never, AppEnvironment>,
	env: AppEnv,
	tableRenames: TableRename[] = [],
) {
	return Effect.runPromise(
		ChangesetGeneratorState.provide(
			TableRenameState.provide(
				programWithErrorCause(
					await programWithContextAndServices(generateMigration, env, layers),
				),
				tableRenames,
			),
		),
	);
}

async function cleanup(
	layers: Layer<Migrator | DbClients, never, AppEnvironment>,
	env: AppEnv,
) {
	const program = DbClients.pipe(
		Effect.flatMap((clients) =>
			Effect.tryPromise(async () => {
				await clients.pgPool.end();
			}),
		),
	);
	return Effect.runPromise(
		programWithErrorCause(
			await programWithContextAndServices(program, env, layers),
		),
	);
}

export const migrate = Effect.gen(function* () {
	const migrator = yield* Migrator;
	const { error, results } = yield* migrator.migrateToLatest(true);
	if (error === undefined && results !== undefined) {
		return true;
	} else {
		return false;
	}
});

async function runMigrate(
	layers: Layer<Migrator | DbClients, never, AppEnvironment>,
	env: AppEnv,
) {
	return Effect.runPromise(
		programWithErrorCause(
			await programWithContextAndServices(migrate, env, layers),
		),
	);
}

async function runMigrateDown(
	layers: Layer<Migrator | DbClients, never, AppEnvironment>,
	env: AppEnv,
) {
	return Effect.runPromise(
		programWithErrorCause(
			await programWithContextAndServices(migrateDownProgram(), env, layers),
		),
	);
}
