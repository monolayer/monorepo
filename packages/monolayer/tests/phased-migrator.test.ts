/* eslint-disable max-lines */
import { Effect, Ref } from "effect";
import { copyFileSync } from "fs";
import { NO_MIGRATIONS } from "kysely";
import path from "path";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import {
	NO_DEPENDENCY,
	migrationPlan,
	type MonolayerMigrationInfo,
} from "~/migrations/migration.js";
import { AppEnvironment, type AppEnv } from "~/state/app-environment.js";
import { Migrator } from "../src/services/migrator.js";
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
	const env: AppEnv = {
		name: "development",
		configurationName: "default",
		folder: ".",
		configuration: {
			schemas: [],
			camelCasePlugin: { enabled: false },
			extensions: [],
			connections: {
				development: {},
			},
		},
	};

	const program = Effect.gen(function* () {
		const migrator = yield* Migrator;
		return yield* migrator.migrateToLatest();
	});

	return Effect.runPromise(
		Effect.provideServiceEffect(
			Effect.provide(programWithErrorCause(program), layers),
			AppEnvironment,
			Ref.make(env),
		),
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
			["monolayer_migration", "monolayer_migration_lock"].sort(),
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
			["monolayer_migration", "monolayer_migration_lock"].sort(),
		);
	});

	test<DbContext>("test rollback plan", async (context) => {
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
				steps: 1,
				names: ["migration8"],
				transaction: false,
			},
			{
				steps: 1,
				names: ["migration7"],
				transaction: true,
			},
			{
				steps: 2,
				names: ["migration5", "migration6"],
				transaction: false,
			},
			{
				steps: 1,
				names: ["migration4"],
				transaction: true,
			},
			{
				steps: 1,
				names: ["migration3"],
				transaction: true,
			},
			{
				steps: 2,
				names: ["migration1", "migration2"],
				transaction: false,
			},
		];
		const layers = newLayers(
			context.dbName,
			path.join(context.folder, "migrations", "default"),
			{ schemas: [] },
		);
		const env: AppEnv = {
			name: "development",
			configurationName: "default",
			folder: ".",
			configuration: {
				schemas: [],
				camelCasePlugin: { enabled: false },
				extensions: [],
				connections: {
					development: {},
				},
			},
		};

		const program = Effect.gen(function* () {
			return yield* Effect.succeed(migrationPlan(migrations, "migration1"));
		});

		const result = await Effect.runPromise(
			Effect.provideServiceEffect(
				Effect.provide(programWithErrorCause(program), layers),
				AppEnvironment,
				Ref.make(env),
			),
		);
		const filteredResult = result.map((r) => ({
			steps: r.steps,
			names: r.migrations.map((m) => m.name),
			transaction: r.transaction,
		}));
		expect(filteredResult.reverse()).toStrictEqual(expected);
	});

	test<DbContext>("test rollback plan to no migrations", async (context) => {
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
				steps: 1,
				names: ["migration8"],
				transaction: false,
			},
			{
				steps: 1,
				names: ["migration7"],
				transaction: true,
			},
			{
				steps: 2,
				names: ["migration5", "migration6"],
				transaction: false,
			},
			{
				steps: 1,
				names: ["migration4"],
				transaction: true,
			},
			{
				steps: 1,
				names: ["migration3"],
				transaction: true,
			},
			{
				steps: Infinity,
				names: ["migration1", "migration2"],
				transaction: false,
			},
		];

		const layers = newLayers(
			context.dbName,
			path.join(context.folder, "migrations", "default"),
			{ schemas: [] },
		);
		const env: AppEnv = {
			name: "development",
			configurationName: "default",
			folder: ".",
			configuration: {
				schemas: [],
				camelCasePlugin: { enabled: false },
				extensions: [],
				connections: {
					development: {},
				},
			},
		};

		const program = Effect.gen(function* () {
			return yield* Effect.succeed(migrationPlan(migrations, NO_MIGRATIONS));
		});

		const result = await Effect.runPromise(
			Effect.provideServiceEffect(
				Effect.provide(programWithErrorCause(program), layers),
				AppEnvironment,
				Ref.make(env),
			),
		);

		const filteredResult = result.map((r) => ({
			steps: r.steps,
			names: r.migrations.map((m) => m.name),
			transaction: r.transaction,
		}));

		expect(filteredResult.reverse()).toStrictEqual(expected);
	});
});
