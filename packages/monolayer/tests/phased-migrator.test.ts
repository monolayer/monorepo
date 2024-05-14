/* eslint-disable max-lines */
import { Effect } from "effect";
import { copyFileSync } from "fs";
import { NO_MIGRATIONS } from "kysely";
import path from "path";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import {
	NO_DEPENDENCY,
	type MonolayerMigrationInfo,
} from "~/migrations/migration.js";
import {
	migrateToLatest,
	migrateToLatestPlan,
	rollbackPlan,
} from "~/migrations/phased-migrator.js";
import type { DbContext } from "./__setup__/helpers/kysely.js";
import { newLayers } from "./__setup__/helpers/layers.js";
import { programWithErrorCause } from "./__setup__/helpers/run-program.js";
import {
	setUpContext,
	teardownContext,
} from "./__setup__/helpers/test-context.js";

async function runPhasedMigration(context: DbContext) {
	const layers = newLayers(
		context.dbName,
		path.join(context.folder, "migrations", "default"),
		{ schemas: [] },
	);
	return Effect.runPromise(
		Effect.provide(programWithErrorCause(migrateToLatest), layers),
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
				path.join(context.folder, "migrations", "default", `${migration}.ts`),
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
				path.join(context.folder, "migrations", "default", `${migration}.ts`),
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
				path.join(context.folder, "migrations", "default", `${migration}.ts`),
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
			["kysely_migration", "kysely_migration_lock"].sort(),
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
				path.join(context.folder, "migrations", "default", `${migration}.ts`),
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
			["kysely_migration", "kysely_migration_lock"].sort(),
		);
	});

	test("test plan up migrations", () => {
		const migrations: MonolayerMigrationInfo[] = [
			{
				migration: {
					up: async () => {},
					down: async () => {},
				},
				name: "migration1",
				scaffold: false,
				dependsOn: NO_DEPENDENCY,
				transaction: false,
			},
			{
				migration: {
					up: async () => {},
					down: async () => {},
				},
				name: "migration2",
				transaction: false,
				dependsOn: "migration1",
				scaffold: false,
			},
			{
				migration: {
					up: async () => {},
					down: async () => {},
				},
				name: "migration3",
				transaction: true,
				dependsOn: "migration2",
				scaffold: false,
			},
			{
				migration: {
					up: async () => {},
					down: async () => {},
				},
				name: "migration4",
				transaction: true,
				dependsOn: "migration3",
				scaffold: false,
			},
			{
				migration: {
					up: async () => {},
					down: async () => {},
				},
				name: "migration5",
				transaction: false,
				dependsOn: "migration4",
				scaffold: false,
			},
			{
				migration: {
					up: async () => {},
					down: async () => {},
				},
				name: "migration6",
				transaction: false,
				dependsOn: "migration5",
				scaffold: false,
			},
			{
				migration: {
					up: async () => {},
					down: async () => {},
				},
				name: "migration7",
				transaction: true,
				dependsOn: "migration6",
				scaffold: false,
			},
			{
				migration: {
					up: async () => {},
					down: async () => {},
				},
				name: "migration8",
				transaction: false,
				dependsOn: "migration7",
				scaffold: false,
			},
		];

		const expected = [
			{
				down: "migration1",
				transaction: false,
				up: "migration2",
			},
			{
				down: "migration3",
				transaction: true,
				up: "migration3",
			},
			{
				down: "migration4",
				transaction: true,
				up: "migration4",
			},
			{
				down: "migration5",
				transaction: false,
				up: "migration6",
			},
			{
				down: "migration7",
				transaction: true,
				up: "migration7",
			},
			{
				down: "migration8",
				transaction: false,
				up: "migration8",
			},
		];
		expect(migrateToLatestPlan(migrations)).toStrictEqual(expected);
	});

	test("test rollback plan", () => {
		const migrations: MonolayerMigrationInfo[] = [
			{
				migration: {
					up: async () => {},
					down: async () => {},
				},
				name: "migration1",
				scaffold: false,
				dependsOn: NO_DEPENDENCY,
				transaction: false,
			},
			{
				migration: {
					up: async () => {},
					down: async () => {},
				},
				name: "migration2",
				transaction: false,
				dependsOn: "migration1",
				scaffold: false,
			},
			{
				migration: {
					up: async () => {},
					down: async () => {},
				},
				name: "migration3",
				transaction: true,
				dependsOn: "migration2",
				scaffold: false,
			},
			{
				migration: {
					up: async () => {},
					down: async () => {},
				},
				name: "migration4",
				transaction: true,
				dependsOn: "migration3",
				scaffold: false,
			},
			{
				migration: {
					up: async () => {},
					down: async () => {},
				},
				name: "migration5",
				transaction: false,
				dependsOn: "migration4",
				scaffold: false,
			},
			{
				migration: {
					up: async () => {},
					down: async () => {},
				},
				name: "migration6",
				transaction: false,
				dependsOn: "migration5",
				scaffold: false,
			},
			{
				migration: {
					up: async () => {},
					down: async () => {},
				},
				name: "migration7",
				transaction: true,
				dependsOn: "migration6",
				scaffold: false,
			},
			{
				migration: {
					up: async () => {},
					down: async () => {},
				},
				name: "migration8",
				transaction: false,
				dependsOn: "migration7",
				scaffold: false,
			},
		];

		const expected = [
			{
				down: "migration8",
				transaction: false,
				up: "migration8",
			},
			{
				down: "migration7",
				transaction: true,
				up: "migration7",
			},
			{
				down: "migration5",
				transaction: false,
				up: "migration6",
			},
			{
				down: "migration4",
				transaction: true,
				up: "migration4",
			},
			{
				down: "migration3",
				transaction: true,
				up: "migration3",
			},
			{
				down: "migration1",
				transaction: false,
				up: "migration2",
			},
		];
		expect(rollbackPlan(migrations, "migration1")).toStrictEqual(expected);
	});

	test("test rollback plan to no migrations", () => {
		const migrations: MonolayerMigrationInfo[] = [
			{
				migration: {
					up: async () => {},
					down: async () => {},
				},
				name: "migration1",
				scaffold: false,
				dependsOn: NO_DEPENDENCY,
				transaction: false,
			},
			{
				migration: {
					up: async () => {},
					down: async () => {},
				},
				name: "migration2",
				transaction: false,
				dependsOn: "migration1",
				scaffold: false,
			},
			{
				migration: {
					up: async () => {},
					down: async () => {},
				},
				name: "migration3",
				transaction: true,
				dependsOn: "migration2",
				scaffold: false,
			},
			{
				migration: {
					up: async () => {},
					down: async () => {},
				},
				name: "migration4",
				transaction: true,
				dependsOn: "migration3",
				scaffold: false,
			},
			{
				migration: {
					up: async () => {},
					down: async () => {},
				},
				name: "migration5",
				transaction: false,
				dependsOn: "migration4",
				scaffold: false,
			},
			{
				migration: {
					up: async () => {},
					down: async () => {},
				},
				name: "migration6",
				transaction: false,
				dependsOn: "migration5",
				scaffold: false,
			},
			{
				migration: {
					up: async () => {},
					down: async () => {},
				},
				name: "migration7",
				transaction: true,
				dependsOn: "migration6",
				scaffold: false,
			},
			{
				migration: {
					up: async () => {},
					down: async () => {},
				},
				name: "migration8",
				transaction: false,
				dependsOn: "migration7",
				scaffold: false,
			},
		];

		const expected = [
			{
				down: "migration8",
				transaction: false,
				up: "migration8",
			},
			{
				down: "migration7",
				transaction: true,
				up: "migration7",
			},
			{
				down: "migration5",
				transaction: false,
				up: "migration6",
			},
			{
				down: "migration4",
				transaction: true,
				up: "migration4",
			},
			{
				down: "migration3",
				transaction: true,
				up: "migration3",
			},
			{
				down: {
					__noMigrations__: true,
				},
				transaction: false,
				up: "migration2",
			},
		];
		expect(rollbackPlan(migrations, NO_MIGRATIONS)).toStrictEqual(expected);
	});
});
