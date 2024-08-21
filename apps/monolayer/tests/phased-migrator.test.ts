/* eslint-disable max-lines */
import { ChangesetPhase } from "@monorepo/pg/changeset/types.js";
import { MonoLayerPgDatabase } from "@monorepo/pg/database.js";
import { Migrator } from "@monorepo/services/migrator.js";
import { type AppEnv } from "@monorepo/state/app-environment.js";
import { Effect } from "effect";
import { copyFileSync } from "fs";
import path from "path";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import type { DbContext } from "~tests/__setup__/helpers/kysely.js";
import { testLayers } from "~tests/__setup__/helpers/layers.js";
import { programWithContextAndServices } from "~tests/__setup__/helpers/run-program.js";
import {
	setUpContext,
	teardownContext,
} from "~tests/__setup__/helpers/test-context.js";

async function runPhasedMigration(context: DbContext) {
	const layers = testLayers(
		context.dbName,
		path.join(context.folder, "migrations", "default"),
		new MonoLayerPgDatabase({ id: "default", schemas: [] }),
	);
	const env: AppEnv = {
		entryPoints: {
			databases: "databases.ts",
		},
		database: new MonoLayerPgDatabase({
			id: "default",
			schemas: [],
			camelCase: false,
			extensions: [],
		}),
	};

	const program = Effect.gen(function* () {
		const migrator = yield* Migrator;
		return yield* migrator.migrateToLatest();
	});

	return Effect.runPromise(
		await programWithContextAndServices(program, env, layers),
	);
}

describe("Phased Migrator", () => {
	beforeEach<DbContext>(async (context) => {
		await setUpContext(context);
	});

	afterEach<DbContext>(async (context) => {
		await teardownContext(context);
	});

	test<DbContext>("should run a single transaction", async (context) => {
		const migrations = [
			"20240405T120024-regulus-mint",
			"20240405T120250-canopus-teal",
			"20240405T153857-alphard-black",
			"20240405T154913-mirfak-mustard",
		];
		for (const migration of migrations) {
			copyFileSync(
				path.join(
					context.currentWorkingDirectory,
					`tests/__setup__/fixtures/migrations/phased-migrator/single-transaction/${migration}.ts`,
				),
				path.join(
					context.folder,
					"migrations",
					"default",
					ChangesetPhase.Alter,
					`${migration}.ts`,
				),
			);
		}
		const result = await runPhasedMigration(context);
		const expected = {
			results: [
				{
					migrationName: "20240405T120024-regulus-mint",
					direction: "Up",
					status: "Success",
				},
				{
					migrationName: "20240405T120250-canopus-teal",
					direction: "Up",
					status: "Success",
				},
				{
					migrationName: "20240405T153857-alphard-black",
					direction: "Up",
					status: "Success",
				},
				{
					migrationName: "20240405T154913-mirfak-mustard",
					direction: "Up",
					status: "Success",
				},
			],
		};
		expect(result.error).toBe(undefined);
		expect(result.results).toStrictEqual(expected.results);

		const expectedTables = [
			"regulus_mint",
			"canopus_teal",
			"alphard_black",
			"mirfak_mustart",
		];
		const tablesExist = await context.kysely
			.selectFrom("pg_catalog.pg_tables")
			.where("schemaname", "=", "public")
			.where("tablename", "in", expectedTables)
			.select("tablename")
			.execute();

		expect(tablesExist.map((r) => r.tablename).sort()).toStrictEqual(
			expectedTables.sort(),
		);
	});

	test<DbContext>("should run multiple transactions", async (context) => {
		const migrations = [
			"20240405T120024-regulus-mint",
			"20240405T120250-canopus-teal",
			"20240405T153857-alphard-black",
			"20240405T154913-mirfak-mustard",
			"20240405T154914-dijon-mustard",
		];
		for (const migration of migrations) {
			copyFileSync(
				path.join(
					context.currentWorkingDirectory,
					`tests/__setup__/fixtures/migrations/phased-migrator/multiple-transactions/${migration}.ts`,
				),
				path.join(
					context.folder,
					"migrations",
					"default",
					ChangesetPhase.Alter,
					`${migration}.ts`,
				),
			);
		}
		const result = await runPhasedMigration(context);

		const expected = {
			results: [
				{
					migrationName: "20240405T120024-regulus-mint",
					direction: "Up",
					status: "Success",
				},
				{
					migrationName: "20240405T120250-canopus-teal",
					direction: "Up",
					status: "Success",
				},
				{
					migrationName: "20240405T153857-alphard-black",
					direction: "Up",
					status: "Success",
				},
				{
					migrationName: "20240405T154913-mirfak-mustard",
					direction: "Up",
					status: "Success",
				},
				{
					migrationName: "20240405T154914-dijon-mustard",
					direction: "Up",
					status: "Success",
				},
			],
		};
		expect(result.error).toBe(undefined);
		expect(result.results).toStrictEqual(expected.results);

		const expectedTables = [
			"regulus_mint",
			"canopus_teal",
			"alphard_black",
			"mirfak_mustart",
			"dijon_mustard",
		];
		const tablesExist = await context.kysely
			.selectFrom("pg_catalog.pg_tables")
			.where("schemaname", "=", "public")
			.where("tablename", "in", expectedTables)
			.select("tablename")
			.execute();

		expect(tablesExist.map((r) => r.tablename).sort()).toStrictEqual(
			expectedTables.sort(),
		);
	});

	test<DbContext>("should run multiple transactions and rollbacks back on errors", async (context) => {
		const migrations = [
			"20240405T120024-regulus-mint",
			"20240405T120250-canopus-teal",
			"20240405T153857-alphard-black",
			"20240405T154913-mirfak-mustard",
			"20240405T154914-dijon-mustard",
		];
		for (const migration of migrations) {
			copyFileSync(
				path.join(
					context.currentWorkingDirectory,
					`tests/__setup__/fixtures/migrations/phased-migrator/error-in-transactionless/${migration}.ts`,
				),
				path.join(
					context.folder,
					"migrations",
					"default",
					ChangesetPhase.Alter,
					`${migration}.ts`,
				),
			);
		}
		const result = await runPhasedMigration(context);
		const expected = {
			error: "[error: relation 'alphard_blallck' does not exist]",
			results: [
				{
					direction: "Up",
					migrationName: "20240405T120024-regulus-mint",
					status: "Success",
				},
				{
					direction: "Up",
					migrationName: "20240405T120250-canopus-teal",
					status: "Success",
				},
				{
					direction: "Up",
					migrationName: "20240405T153857-alphard-black",
					status: "Error",
				},
				{
					direction: "Up",
					migrationName: "20240405T154913-mirfak-mustard",
					status: "NotExecuted",
				},
				{
					direction: "Up",
					migrationName: "20240405T154914-dijon-mustard",
					status: "NotExecuted",
				},
			],
		};
		expect(result.error?.toString()).toStrictEqual(
			'error: relation "alphard_blallck" does not exist',
		);
		expect(result.results).toStrictEqual(expected.results);

		const tablesExist = await context.kysely
			.selectFrom("pg_catalog.pg_tables")
			.where("schemaname", "=", "public")
			.select("tablename")
			.execute();

		expect(tablesExist.map((r) => r.tablename).sort()).toStrictEqual(
			["monolayer_alter_migration", "monolayer_alter_migration_lock"].sort(),
		);
	});

	test<DbContext>("run single transactions and rollbacks back on errors", async (context) => {
		const migrations = [
			"20240405T120024-regulus-mint",
			"20240405T120250-canopus-teal",
			"20240405T153857-alphard-black",
			"20240405T154913-mirfak-mustard",
			"20240405T154914-dijon-mustard",
		];
		for (const migration of migrations) {
			copyFileSync(
				path.join(
					context.currentWorkingDirectory,
					`tests/__setup__/fixtures/migrations/phased-migrator/error-in-transaction/${migration}.ts`,
				),
				path.join(
					context.folder,
					"migrations",
					"default",
					ChangesetPhase.Alter,
					`${migration}.ts`,
				),
			);
		}
		const result = await runPhasedMigration(context);
		const expected = {
			error: "[error: relation 'alphard_blallck' does not exist]",
			results: [
				{
					direction: "Up",
					migrationName: "20240405T120024-regulus-mint",
					status: "Success",
				},
				{
					direction: "Up",
					migrationName: "20240405T120250-canopus-teal",
					status: "Success",
				},
				{
					direction: "Up",
					migrationName: "20240405T153857-alphard-black",
					status: "Success",
				},
				{
					direction: "Up",
					migrationName: "20240405T154913-mirfak-mustard",
					status: "Error",
				},
				{
					direction: "Up",
					migrationName: "20240405T154914-dijon-mustard",
					status: "NotExecuted",
				},
			],
		};
		expect(result.error?.toString()).toStrictEqual(
			'error: relation "alphard_blallck" does not exist',
		);
		expect(result.results).toStrictEqual(expected.results);

		const tablesExist = await context.kysely
			.selectFrom("pg_catalog.pg_tables")
			.where("schemaname", "=", "public")
			.select("tablename")
			.execute();

		expect(tablesExist.map((r) => r.tablename).sort()).toStrictEqual(
			["monolayer_alter_migration", "monolayer_alter_migration_lock"].sort(),
		);
	});
});
