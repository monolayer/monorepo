import { Effect } from "effect";
import { expect } from "vitest";
import { generateChangesetMigration } from "~/programs/generate-changeset-migration.js";
import { migrateDown as migrateDownProgram } from "~/programs/migrate-down.js";
import { migrate } from "~/programs/migrate.js";
import { DbClients } from "~/services/dbClients.js";
import type { DbContext } from "~tests/setup/kysely.js";
import { newLayers, type EnvironmentLessConnector } from "./layers.js";
import { programWithErrorCause } from "./run-program.js";

export async function testChangesetAndMigrations({
	context,
	connector,
	expected,
	down,
}: {
	context: DbContext;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	expected: any[];
	down: "same" | "reverse" | "empty";
	connector: EnvironmentLessConnector;
}) {
	if (connector.camelCasePlugin === undefined) {
		connector.camelCasePlugin = { enabled: false };
	}
	const result = await runGenerateChangesetMigration(
		context.dbName,
		context.folder,
		connector,
	);

	expect(result).toEqual(expected);

	const migrationResult = await runMigrate(
		context.dbName,
		context.folder,
		connector,
	);
	expect(migrationResult).toBe(true);

	const afterUpCs = await runGenerateChangesetMigration(
		context.dbName,
		context.folder,
		connector,
	);
	expect(afterUpCs).toEqual([]);

	const migrateDownResult = await runMigrateDown(
		context.dbName,
		context.folder,
		connector,
	);
	expect(migrateDownResult).toBe(true);

	switch (down) {
		case "reverse": {
			const afterDownCs = await runGenerateChangesetMigration(
				context.dbName,
				context.folder,
				connector,
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
				context.dbName,
				context.folder,
				connector,
			);
			expect(afterDownCs).toEqual(
				result.filter((changeset) => changeset.type !== "createSchema"),
			);
			break;
		}
		case "empty": {
			const afterDownCs = await runGenerateChangesetMigration(
				context.dbName,
				context.folder,
				connector,
			);
			expect(afterDownCs).toEqual([]);
			break;
		}
	}
}

async function runGenerateChangesetMigration(
	dbName: string,
	folder: string,
	connector: EnvironmentLessConnector,
) {
	return Effect.runPromise(
		Effect.provide(
			programWithErrorCause(generateChangesetMigration()).pipe(
				Effect.tap(() => cleanup()),
			),
			newLayers(dbName, folder, connector),
		),
	);
}

function cleanup() {
	return Effect.all([DbClients]).pipe(
		Effect.tap(async ([clients]) => {
			clients.currentEnvironment.pgPool.end();
			clients.currentEnvironment.pgAdminPool.end();
		}),
	);
}
async function runMigrate(
	dbName: string,
	folder: string,
	connector: EnvironmentLessConnector,
) {
	return Effect.runPromise(
		Effect.provide(
			programWithErrorCause(migrate()).pipe(Effect.tap(() => cleanup())),
			newLayers(dbName, folder, connector),
		),
	);
}

async function runMigrateDown(
	dbName: string,
	folder: string,
	connector: EnvironmentLessConnector,
) {
	return Effect.runPromise(
		Effect.provide(
			programWithErrorCause(migrateDownProgram()).pipe(
				Effect.tap(() => cleanup()),
			),
			newLayers(dbName, folder, connector),
		),
	);
}
