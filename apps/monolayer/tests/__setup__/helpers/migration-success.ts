import {
	MonoLayerPgDatabase,
	type DatabaseConfig,
} from "@monorepo/pg/database.js";
import { DbClients } from "@monorepo/services/db-clients.js";
import { Migrator } from "@monorepo/services/migrator.js";
import {
	AppEnvironment,
	type AppEnv,
} from "@monorepo/state/app-environment.js";
import { Effect, Ref } from "effect";
import type { Layer } from "effect/Layer";
import path from "path";
import { expect } from "vitest";
import { generateMigration } from "~/actions/migrations/generate.js";
import type { DbContext } from "~tests/__setup__/helpers/kysely.js";
import { migrateDown as migrateDownProgram } from "~tests/__setup__/helpers/migrate-down.js";
import { newLayers } from "./layers.js";
import { programWithErrorCause } from "./run-program.js";

export async function testChangesetAndMigrations({
	context,
	configuration,
	expected,
	down,
	mock = () => true,
}: {
	context: DbContext;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	expected: any[];
	down: "same" | "reverse" | "empty";
	configuration: DatabaseConfig;
	mock?: () => void;
}) {
	const env: AppEnv = {
		folder: ".",
		database: new MonoLayerPgDatabase("default", {
			schemas: configuration.schemas,
			camelCase: configuration.camelCase ?? false,
			extensions: configuration.extensions ?? [],
		}),
	};
	const layers = newLayers(
		context.dbName,
		path.join(context.folder, "migrations", "default"),
		env.database,
	);

	mock();

	const result = await runGenerateChangesetMigration(layers, env);

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
			const afterDownCs = await runGenerateChangesetMigration(layers, env);
			expect(afterDownCs).toEqual(
				result
					.reverse()
					.filter((changeset) => changeset.type !== "createSchema"),
			);
			break;
		}
		case "same": {
			const afterDownCs = await runGenerateChangesetMigration(layers, env);
			expect(afterDownCs).toEqual(result);
			break;
		}
		case "empty": {
			const afterDownCs = await runGenerateChangesetMigration(layers, env);
			expect(afterDownCs).toEqual([]);
			break;
		}
	}
	await cleanup(layers, env);
}

async function runGenerateChangesetMigration(
	layers: Layer<Migrator | DbClients, never, AppEnvironment>,
	env: AppEnv,
) {
	return Effect.runPromise(
		Effect.provideServiceEffect(
			Effect.provide(programWithErrorCause(generateMigration()), layers),
			AppEnvironment,
			Ref.make(env),
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
		Effect.provideServiceEffect(
			Effect.provide(programWithErrorCause(program), layers),
			AppEnvironment,
			Ref.make(env),
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
		Effect.provideServiceEffect(
			Effect.provide(programWithErrorCause(migrate), layers),
			AppEnvironment,
			Ref.make(env),
		),
	);
}

async function runMigrateDown(
	layers: Layer<Migrator | DbClients, never, AppEnvironment>,
	env: AppEnv,
) {
	return Effect.runPromise(
		Effect.provideServiceEffect(
			Effect.provide(programWithErrorCause(migrateDownProgram()), layers),
			AppEnvironment,
			Ref.make(env),
		),
	);
}
