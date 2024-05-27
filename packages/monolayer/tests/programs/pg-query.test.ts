import dotenv from "dotenv";
import { Effect, Layer, Ref } from "effect";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { loadEnv } from "~/cli/cli-action.js";
import { phasedMigratorLayer } from "~/migrations/phased-migrator.js";
import {
	adminPgQuery,
	dbClientsLayer,
	pgQuery,
} from "~/services/db-clients.js";
import { AppEnvironment } from "~/state/app-environment.js";
import { programWithErrorCause } from "~tests/__setup__/helpers/run-program.js";
import {
	setupProgramContext,
	teardownProgramContext,
	type ProgramContext,
} from "~tests/__setup__/helpers/test-context.js";
dotenv.config();

describe("pgQuery", () => {
	beforeEach<ProgramContext>(async (context) => {
		await setupProgramContext(context);
	});

	afterEach<ProgramContext>(async (context) => {
		await teardownProgramContext(context);
	});

	test("configurations", async () => {
		const layersWithDefaultConfiguration = phasedMigratorLayer().pipe(
			Layer.provideMerge(dbClientsLayer()),
		);

		const layersWithStatsConfiguration = phasedMigratorLayer().pipe(
			Layer.provideMerge(dbClientsLayer()),
		);

		const defaultDatabase = await Effect.runPromise(
			Effect.provideServiceEffect(
				Effect.provide(
					programWithErrorCause(pgQuery(`SELECT CURRENT_DATABASE();`)),
					layersWithDefaultConfiguration,
				),
				AppEnvironment,
				Ref.make(await loadEnv("development", "default")),
			),
		);

		expect(defaultDatabase).toStrictEqual([{ current_database: "d7e08363" }]);

		const statsDatabase = await Effect.runPromise(
			Effect.provideServiceEffect(
				Effect.provide(
					programWithErrorCause(pgQuery(`SELECT CURRENT_DATABASE();`)),
					layersWithStatsConfiguration,
				),
				AppEnvironment,
				Ref.make(await loadEnv("development", "stats")),
			),
		);

		expect(statsDatabase).toStrictEqual([
			{ current_database: "d7e08363_stats" },
		]);
	});

	test("configuration connections", async () => {
		const layersWithDefaultConfiguration = phasedMigratorLayer().pipe(
			Layer.provideMerge(dbClientsLayer()),
		);

		const layersWithStatsConfiguration = phasedMigratorLayer().pipe(
			Layer.provideMerge(dbClientsLayer()),
		);

		const defaultDatabase = await Effect.runPromise(
			Effect.provideServiceEffect(
				Effect.provide(
					programWithErrorCause(pgQuery(`SELECT CURRENT_DATABASE();`)),
					layersWithDefaultConfiguration,
				),
				AppEnvironment,
				Ref.make(await loadEnv("test", "default")),
			),
		);

		expect(defaultDatabase).toStrictEqual([
			{ current_database: "1d6addc0_test" },
		]);

		const statsDatabase = await Effect.runPromise(
			Effect.provideServiceEffect(
				Effect.provide(
					programWithErrorCause(pgQuery(`SELECT CURRENT_DATABASE();`)),
					layersWithStatsConfiguration,
				),
				AppEnvironment,
				Ref.make(await loadEnv("test", "stats")),
			),
		);

		expect(statsDatabase).toStrictEqual([
			{ current_database: "1d6addc0_stats_test" },
		]);
	});
});

describe("adminPgQuery", () => {
	beforeEach<ProgramContext>(async (context) => {
		await setupProgramContext(context);
	});

	afterEach<ProgramContext>(async (context) => {
		await teardownProgramContext(context);
	});

	test("admin configurations connect to 'postgres'", async () => {
		const layersWithDefaultConfiguration = phasedMigratorLayer().pipe(
			Layer.provideMerge(dbClientsLayer()),
		);

		const layersWithStatsConfiguration = phasedMigratorLayer().pipe(
			Layer.provideMerge(dbClientsLayer()),
		);

		const defaultDatabase = await Effect.runPromise(
			Effect.provideServiceEffect(
				Effect.provide(
					programWithErrorCause(adminPgQuery(`SELECT CURRENT_DATABASE();`)),
					layersWithDefaultConfiguration,
				),
				AppEnvironment,
				Ref.make(await loadEnv("development", "default")),
			),
		);

		expect(defaultDatabase).toStrictEqual([{ current_database: "postgres" }]);

		const statsDatabase = await Effect.runPromise(
			Effect.provideServiceEffect(
				Effect.provide(
					programWithErrorCause(adminPgQuery(`SELECT CURRENT_DATABASE();`)),
					layersWithStatsConfiguration,
				),
				AppEnvironment,
				Ref.make(await loadEnv("development", "default")),
			),
		);

		expect(statsDatabase).toStrictEqual([{ current_database: "postgres" }]);
	});

	test("admin connections connect to 'postgres'", async () => {
		const layersWithDefaultConfiguration = phasedMigratorLayer().pipe(
			Layer.provideMerge(dbClientsLayer()),
		);

		const layersWithStatsConfiguration = phasedMigratorLayer().pipe(
			Layer.provideMerge(dbClientsLayer()),
		);

		const defaultDatabase = await Effect.runPromise(
			Effect.provideServiceEffect(
				Effect.provide(
					programWithErrorCause(adminPgQuery(`SELECT CURRENT_DATABASE();`)),
					layersWithDefaultConfiguration,
				),
				AppEnvironment,
				Ref.make(await loadEnv("development", "default")),
			),
		);

		expect(defaultDatabase).toStrictEqual([{ current_database: "postgres" }]);

		const statsDatabase = await Effect.runPromise(
			Effect.provideServiceEffect(
				Effect.provide(
					programWithErrorCause(adminPgQuery(`SELECT CURRENT_DATABASE();`)),
					layersWithStatsConfiguration,
				),
				AppEnvironment,
				Ref.make(await loadEnv("development", "default")),
			),
		);

		expect(statsDatabase).toStrictEqual([{ current_database: "postgres" }]);
	});
});
