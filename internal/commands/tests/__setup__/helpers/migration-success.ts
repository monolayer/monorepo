import { programWithContextAndServices } from "@monorepo/commands/cli-action.js";
import { ChangesetGeneratorState } from "@monorepo/pg/changeset/changeset-generator.js";
import { PgDatabase, type PgDatabaseConfig } from "@monorepo/pg/database.js";
import { generateMigration } from "@monorepo/programs/migrations/generate.js";
import { RenameState } from "@monorepo/programs/table-renames.js";
import { DbClients } from "@monorepo/services/db-clients.js";
import { Migrator } from "@monorepo/services/migrator.js";
import {
	AppEnvironment,
	type AppEnv,
} from "@monorepo/state/app-environment.js";
import {
	PackageNameState,
	makePackageNameState,
} from "@monorepo/state/package-name.js";
import type { TableRename } from "@monorepo/state/table-column-rename.js";
import { Effect, Layer as LayerEffect } from "effect";
import type { Layer } from "effect/Layer";
import type { Scope } from "effect/Scope";
import path from "path";
import { expect } from "vitest";
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
	configuration: PgDatabaseConfig;
	tableRenames?: TableRename[];
	mock?: () => void;
}) {
	const env: AppEnv = {
		databases: "databases.ts",
		currentDatabase: new PgDatabase({
			id: "default",
			schemas: configuration.schemas,
			camelCase: configuration.camelCase ?? false,
			extensions: configuration.extensions ?? [],
		}),
	};
	const layers = testLayers(
		context.dbName,
		path.join(context.folder, "migrations", "default"),
		env.currentDatabase,
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
	layers: Layer<Migrator | DbClients, never, AppEnvironment | Scope>,
	env: AppEnv,
	tableRenames: TableRename[] = [],
) {
	return Effect.runPromise(
		ChangesetGeneratorState.provide(
			RenameState.provide(
				Effect.provide(
					programWithErrorCause(
						await programWithContextAndServices(generateMigration, env, layers),
					),
					LayerEffect.effect(
						PackageNameState,
						makePackageNameState("@monolayer/pg"),
					),
				),
				{ tableRenames: tableRenames },
			),
		),
	);
}

async function cleanup(
	layers: Layer<Migrator | DbClients, never, AppEnvironment | Scope>,
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
	layers: Layer<Migrator | DbClients, never, AppEnvironment | Scope>,
	env: AppEnv,
) {
	return Effect.runPromise(
		programWithErrorCause(
			await programWithContextAndServices(migrate, env, layers),
		),
	);
}

async function runMigrateDown(
	layers: Layer<Migrator | DbClients, never, AppEnvironment | Scope>,
	env: AppEnv,
) {
	return Effect.runPromise(
		programWithErrorCause(
			await programWithContextAndServices(migrateDownProgram(), env, layers),
		),
	);
}
