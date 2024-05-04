import { Effect, Ref } from "effect";
import type { Layer } from "effect/Layer";
import path from "path";
import { expect } from "vitest";
import { migrate } from "~/migrations/apply.js";
import { generateMigration } from "~/migrations/generate.js";
import { DbClients } from "~/services/db-clients.js";
import type { Migrator } from "~/services/migrator.js";
import { AppEnvironment, type AppEnv } from "~/state/app-environment.js";
import type { DbContext } from "~tests/__setup__/helpers/kysely.js";
import { migrateDown as migrateDownProgram } from "~tests/__setup__/helpers/migrate-down.js";
import { newLayers, type EnvironmentLessConnector } from "./layers.js";
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
	configuration: EnvironmentLessConnector;
	mock?: () => void;
}) {
	const env: AppEnv = {
		name: "development",
		configurationName: "default",
		folder: ".",
		configuration: {
			schemas: configuration.schemas,
			camelCasePlugin: configuration.camelCasePlugin ?? { enabled: false },
			extensions: configuration.extensions ?? [],
			environments: {
				development: {},
			},
		},
	};
	const layers = newLayers(
		context.dbName,
		path.join(context.folder, "migrations", "default"),
		configuration,
	);

	mock();

	const result = await runGenerateChangesetMigration(layers, env);

	expect(result).toEqual(expected);

	const migrationResult = await runMigrate(layers);
	expect(migrationResult).toBe(true);

	const afterUpCs = await runGenerateChangesetMigration(layers, env);
	expect(afterUpCs).toEqual([]);

	const migrateDownResult = await runMigrateDown(layers);
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
	Effect.runPromise(Effect.provide(programWithErrorCause(cleanup()), layers));
}

async function runGenerateChangesetMigration(
	layers: Layer<Migrator | DbClients, never, never>,
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

function cleanup() {
	return DbClients.pipe(
		Effect.flatMap((clients) =>
			Effect.tryPromise(async () => {
				await clients.currentEnvironment.pgPool.end();
			}),
		),
	);
}

async function runMigrate(layers: Layer<Migrator | DbClients, never, never>) {
	return Effect.runPromise(
		Effect.provide(programWithErrorCause(migrate()), layers),
	);
}

async function runMigrateDown(
	layers: Layer<Migrator | DbClients, never, never>,
) {
	return Effect.runPromise(
		Effect.provide(programWithErrorCause(migrateDownProgram()), layers),
	);
}
