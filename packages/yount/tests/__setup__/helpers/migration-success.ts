import { Effect } from "effect";
import type { Layer } from "effect/Layer";
import { expect } from "vitest";
import { generateRevision } from "~/revisions/generate.js";
import { migrate } from "~/revisions/migrate.js";
import { DbClients } from "~/services/dbClients.js";
import type { DevEnvironment, Environment } from "~/services/environment.js";
import type { Migrator } from "~/services/migrator.js";
import { migrateDown as migrateDownProgram } from "~/test/__setup__/helpers/migrate-down.js";
import type { DbContext } from "~tests/__setup__/helpers/kysely.js";
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
	if (configuration.camelCasePlugin === undefined) {
		configuration.camelCasePlugin = { enabled: false };
	}

	const layers = newLayers(context.dbName, context.folder, configuration);

	mock();

	const result = await runGenerateChangesetMigration(layers);

	expect(result).toEqual(expected);

	const migrationResult = await runMigrate(layers);
	expect(migrationResult).toBe(true);

	const afterUpCs = await runGenerateChangesetMigration(layers);
	expect(afterUpCs).toEqual([]);

	const migrateDownResult = await runMigrateDown(layers);
	expect(migrateDownResult).toBe(true);

	mock();

	switch (down) {
		case "reverse": {
			const afterDownCs = await runGenerateChangesetMigration(layers);
			expect(afterDownCs).toEqual(
				result
					.reverse()
					.filter((changeset) => changeset.type !== "createSchema"),
			);
			break;
		}
		case "same": {
			const afterDownCs = await runGenerateChangesetMigration(layers);
			expect(afterDownCs).toEqual(result);
			break;
		}
		case "empty": {
			const afterDownCs = await runGenerateChangesetMigration(layers);
			expect(afterDownCs).toEqual([]);
			break;
		}
	}
	Effect.runPromise(Effect.provide(programWithErrorCause(cleanup()), layers));
}

async function runGenerateChangesetMigration(
	layers: Layer<
		Migrator | DbClients | Environment | DevEnvironment,
		never,
		never
	>,
) {
	return Effect.runPromise(
		Effect.provide(programWithErrorCause(generateRevision()), layers),
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

async function runMigrate(
	layers: Layer<
		Migrator | DbClients | Environment | DevEnvironment,
		never,
		never
	>,
) {
	return Effect.runPromise(
		Effect.provide(programWithErrorCause(migrate()), layers),
	);
}

async function runMigrateDown(
	layers: Layer<
		Migrator | DbClients | Environment | DevEnvironment,
		never,
		never
	>,
) {
	return Effect.runPromise(
		Effect.provide(programWithErrorCause(migrateDownProgram()), layers),
	);
}
