import { Effect } from "effect";
import { expect } from "vitest";
import { generateChangesetMigration } from "~/cli/programs/generate-changeset-migration.js";
import { migrateDown as migrateDownProgram } from "~/cli/programs/migrate-down.js";
import { migrate } from "~/cli/programs/migrate.js";

import { DbClients } from "~/cli/services/dbClients.js";
import type { CamelCaseOptions } from "~/configuration.js";
import type { AnySchema } from "~/schema/schema.js";
import type { DbContext } from "~tests/setup/kysely.js";
import { newLayers } from "./layers.js";
import { programWithErrorCause } from "./run-program.js";

export async function testChangesetAndMigrations({
	context,
	database,
	expected,
	down,
	useCamelCase = { enabled: false },
}: {
	context: DbContext;
	database: AnySchema;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	expected: any[];
	down: "same" | "reverse" | "empty";
	useCamelCase?: CamelCaseOptions;
}) {
	const result = await runGenerateChangesetMigration(
		context.dbName,
		context.folder,
		database,
		useCamelCase,
	);

	expect(result).toEqual(expected);

	const migrationResult = await runMigrate(
		context.dbName,
		context.folder,
		database,
		useCamelCase,
	);
	expect(migrationResult).toBe(true);

	const afterUpCs = await runGenerateChangesetMigration(
		context.dbName,
		context.folder,
		database,
		useCamelCase,
	);
	expect(afterUpCs).toEqual([]);

	const migrateDownResult = await runMigrateDown(
		context.dbName,
		context.folder,
		database,
		useCamelCase,
	);
	expect(migrateDownResult).toBe(true);

	switch (down) {
		case "reverse": {
			const afterDownCs = await runGenerateChangesetMigration(
				context.dbName,
				context.folder,
				database,
				useCamelCase,
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
				database,
				useCamelCase,
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
				database,
				useCamelCase,
			);
			expect(afterDownCs).toEqual([]);
			break;
		}
	}
}

async function runGenerateChangesetMigration(
	dbName: string,
	folder: string,
	schema: AnySchema,
	useCamelCase = { enabled: false },
) {
	return Effect.runPromise(
		Effect.provide(
			programWithErrorCause(generateChangesetMigration()).pipe(
				Effect.tap(() => cleanup()),
			),
			newLayers(dbName, folder, [schema], useCamelCase),
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
	schema: AnySchema,
	useCamelCase = { enabled: false },
) {
	return Effect.runPromise(
		Effect.provide(
			programWithErrorCause(migrate()).pipe(Effect.tap(() => cleanup())),
			newLayers(dbName, folder, [schema], useCamelCase),
		),
	);
}

async function runMigrateDown(
	dbName: string,
	folder: string,
	schema: AnySchema,
	useCamelCase = { enabled: false },
) {
	return Effect.runPromise(
		Effect.provide(
			programWithErrorCause(migrateDownProgram()).pipe(
				Effect.tap(() => cleanup()),
			),
			newLayers(dbName, folder, [schema], useCamelCase),
		),
	);
}
