import dotenv from "dotenv";
import { Effect, Layer } from "effect";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import {
	adminDevPgQuery,
	adminPgQuery,
	dbClientsLayer,
	pgQuery,
} from "~/services/db-clients.js";
import {
	devEnvironmentLayer,
	environmentLayer,
} from "~/services/environment.js";
import { migratorLayer } from "~/services/migrator.js";
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
		const layersWithDefaultConfiguration = migratorLayer().pipe(
			Layer.provideMerge(dbClientsLayer()),
			Layer.provideMerge(environmentLayer("development", "default")),
			Layer.provideMerge(devEnvironmentLayer("default")),
		);

		const layersWithStatsConfiguration = migratorLayer().pipe(
			Layer.provideMerge(dbClientsLayer()),
			Layer.provideMerge(environmentLayer("development", "stats")),
			Layer.provideMerge(devEnvironmentLayer("stats")),
		);

		const defaultDatabase = await Effect.runPromise(
			Effect.provide(
				programWithErrorCause(pgQuery(`SELECT CURRENT_DATABASE();`)),
				layersWithDefaultConfiguration,
			),
		);
		expect(defaultDatabase).toStrictEqual([{ current_database: "d7e08363" }]);

		const statsDatabase = await Effect.runPromise(
			Effect.provide(
				programWithErrorCause(pgQuery(`SELECT CURRENT_DATABASE();`)),
				layersWithStatsConfiguration,
			),
		);
		expect(statsDatabase).toStrictEqual([
			{ current_database: "d7e08363_stats" },
		]);
	});

	test("configuration environments", async () => {
		const layersWithDefaultConfiguration = migratorLayer().pipe(
			Layer.provideMerge(dbClientsLayer()),
			Layer.provideMerge(environmentLayer("test", "default")),
			Layer.provideMerge(devEnvironmentLayer("default")),
		);

		const layersWithStatsConfiguration = migratorLayer().pipe(
			Layer.provideMerge(dbClientsLayer()),
			Layer.provideMerge(environmentLayer("test", "stats")),
			Layer.provideMerge(devEnvironmentLayer("stats")),
		);

		const defaultDatabase = await Effect.runPromise(
			Effect.provide(
				programWithErrorCause(pgQuery(`SELECT CURRENT_DATABASE();`)),
				layersWithDefaultConfiguration,
			),
		);
		expect(defaultDatabase).toStrictEqual([
			{ current_database: "10da7aa4_test" },
		]);

		const statsDatabase = await Effect.runPromise(
			Effect.provide(
				programWithErrorCause(pgQuery(`SELECT CURRENT_DATABASE();`)),
				layersWithStatsConfiguration,
			),
		);
		expect(statsDatabase).toStrictEqual([
			{ current_database: "10da7aa4_stats_test" },
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
		const layersWithDefaultConfiguration = migratorLayer().pipe(
			Layer.provideMerge(dbClientsLayer()),
			Layer.provideMerge(environmentLayer("development", "default")),
			Layer.provideMerge(devEnvironmentLayer("default")),
		);

		const layersWithStatsConfiguration = migratorLayer().pipe(
			Layer.provideMerge(dbClientsLayer()),
			Layer.provideMerge(environmentLayer("development", "stats")),
			Layer.provideMerge(devEnvironmentLayer("stats")),
		);

		const defaultDatabase = await Effect.runPromise(
			Effect.provide(
				programWithErrorCause(adminPgQuery(`SELECT CURRENT_DATABASE();`)),
				layersWithDefaultConfiguration,
			),
		);
		expect(defaultDatabase).toStrictEqual([{ current_database: "postgres" }]);

		const statsDatabase = await Effect.runPromise(
			Effect.provide(
				programWithErrorCause(adminPgQuery(`SELECT CURRENT_DATABASE();`)),
				layersWithStatsConfiguration,
			),
		);
		expect(statsDatabase).toStrictEqual([{ current_database: "postgres" }]);
	});

	test("admin environments connect to 'postgres'", async () => {
		const layersWithDefaultConfiguration = migratorLayer().pipe(
			Layer.provideMerge(dbClientsLayer()),
			Layer.provideMerge(environmentLayer("test", "default")),
			Layer.provideMerge(devEnvironmentLayer("default")),
		);

		const layersWithStatsConfiguration = migratorLayer().pipe(
			Layer.provideMerge(dbClientsLayer()),
			Layer.provideMerge(environmentLayer("test", "stats")),
			Layer.provideMerge(devEnvironmentLayer("stats")),
		);

		const defaultDatabase = await Effect.runPromise(
			Effect.provide(
				programWithErrorCause(adminPgQuery(`SELECT CURRENT_DATABASE();`)),
				layersWithDefaultConfiguration,
			),
		);
		expect(defaultDatabase).toStrictEqual([{ current_database: "postgres" }]);

		const statsDatabase = await Effect.runPromise(
			Effect.provide(
				programWithErrorCause(adminPgQuery(`SELECT CURRENT_DATABASE();`)),
				layersWithStatsConfiguration,
			),
		);
		expect(statsDatabase).toStrictEqual([{ current_database: "postgres" }]);
	});
});

describe("devAdminPgQuery", () => {
	beforeEach<ProgramContext>(async (context) => {
		await setupProgramContext(context);
	});

	afterEach<ProgramContext>(async (context) => {
		await teardownProgramContext(context);
	});

	test<ProgramContext>("default configurations connect to dev host postgres", async (context) => {
		const layers = migratorLayer().pipe(
			Layer.provideMerge(dbClientsLayer()),
			Layer.provideMerge(environmentLayer("test", "default")),
			Layer.provideMerge(devEnvironmentLayer("default")),
		);

		const pgOneAddr = await context.pool.query(`SELECT inet_server_addr();`);
		const result = await Effect.runPromise(
			Effect.provide(
				programWithErrorCause(adminDevPgQuery(`SELECT inet_server_addr();`)),
				layers,
			),
		);
		expect(result).toStrictEqual(pgOneAddr.rows);

		const statsDatabase = await Effect.runPromise(
			Effect.provide(
				programWithErrorCause(adminPgQuery(`SELECT CURRENT_DATABASE();`)),
				layers,
			),
		);
		expect(statsDatabase).toStrictEqual([{ current_database: "postgres" }]);
	});

	test<ProgramContext>("other configurations connect to dev host postgres", async (context) => {
		const layers = migratorLayer().pipe(
			Layer.provideMerge(dbClientsLayer()),
			Layer.provideMerge(environmentLayer("test", "stats")),
			Layer.provideMerge(devEnvironmentLayer("stats")),
		);

		const poolAddr = await context.pool.query(`SELECT inet_server_addr();`);
		const result = await Effect.runPromise(
			Effect.provide(
				programWithErrorCause(adminDevPgQuery(`SELECT inet_server_addr();`)),
				layers,
			),
		);
		expect(result).toStrictEqual(poolAddr.rows);

		const statsDatabase = await Effect.runPromise(
			Effect.provide(
				programWithErrorCause(adminPgQuery(`SELECT CURRENT_DATABASE();`)),
				layers,
			),
		);
		expect(statsDatabase).toStrictEqual([{ current_database: "postgres" }]);
	});
});
