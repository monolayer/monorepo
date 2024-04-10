import dotenv from "dotenv";
import { Effect, Layer } from "effect";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import {
	adminDevPgQuery,
	adminPgQuery,
	pgQuery,
} from "~/cli/programs/pg-query.js";
import { dbClientsLayer } from "~/cli/services/dbClients.js";
import {
	devEnvironmentLayer,
	environmentLayer,
} from "~/cli/services/environment.js";
import { devKyselyLayer, kyselyLayer } from "~/cli/services/kysely.js";
import { migratorLayer } from "~/cli/services/migrator.js";
import { devPgLayer, pgLayer } from "~/cli/services/pg.js";
import { programWithErrorCause } from "~tests/helpers/run-program.js";
import {
	setupProgramContext,
	teardownProgramContext,
	type ProgramContext,
} from "~tests/helpers/test-context.js";
dotenv.config();

describe("pgQuery", () => {
	beforeEach<ProgramContext>(async (context) => {
		await setupProgramContext(context);
	});

	afterEach<ProgramContext>(async (context) => {
		await teardownProgramContext(context);
	});

	test("connectors", async () => {
		const layersWithDefaultConnection = migratorLayer().pipe(
			Layer.provideMerge(kyselyLayer()),
			Layer.provideMerge(devKyselyLayer()),
			Layer.provideMerge(pgLayer()),
			Layer.provideMerge(dbClientsLayer()),
			Layer.provideMerge(devPgLayer()),
			Layer.provideMerge(environmentLayer("development", "default")),
			Layer.provideMerge(devEnvironmentLayer("default")),
		);

		const layersWithStatsConnection = migratorLayer().pipe(
			Layer.provideMerge(kyselyLayer()),
			Layer.provideMerge(devKyselyLayer()),
			Layer.provideMerge(pgLayer()),
			Layer.provideMerge(devPgLayer()),
			Layer.provideMerge(dbClientsLayer()),
			Layer.provideMerge(environmentLayer("development", "stats")),
			Layer.provideMerge(devEnvironmentLayer("stats")),
		);

		const defaultDatabase = await Effect.runPromise(
			Effect.provide(
				programWithErrorCause(pgQuery(`SELECT CURRENT_DATABASE();`)),
				layersWithDefaultConnection,
			),
		);
		expect(defaultDatabase).toStrictEqual([{ current_database: "connectors" }]);

		const statsDatabase = await Effect.runPromise(
			Effect.provide(
				programWithErrorCause(pgQuery(`SELECT CURRENT_DATABASE();`)),
				layersWithStatsConnection,
			),
		);
		expect(statsDatabase).toStrictEqual([
			{ current_database: "connectors_stats" },
		]);
	});

	test("connection environments", async () => {
		const layersWithDefaultConnection = migratorLayer().pipe(
			Layer.provideMerge(kyselyLayer()),
			Layer.provideMerge(pgLayer()),
			Layer.provideMerge(devPgLayer()),
			Layer.provideMerge(dbClientsLayer()),
			Layer.provideMerge(environmentLayer("test", "default")),
			Layer.provideMerge(devEnvironmentLayer("default")),
		);

		const layersWithStatsConnection = migratorLayer().pipe(
			Layer.provideMerge(kyselyLayer()),
			Layer.provideMerge(pgLayer()),
			Layer.provideMerge(devPgLayer()),
			Layer.provideMerge(dbClientsLayer()),
			Layer.provideMerge(environmentLayer("test", "stats")),
			Layer.provideMerge(devEnvironmentLayer("stats")),
		);

		const defaultDatabase = await Effect.runPromise(
			Effect.provide(
				programWithErrorCause(pgQuery(`SELECT CURRENT_DATABASE();`)),
				layersWithDefaultConnection,
			),
		);
		expect(defaultDatabase).toStrictEqual([
			{ current_database: "connection_environments_test" },
		]);

		const statsDatabase = await Effect.runPromise(
			Effect.provide(
				programWithErrorCause(pgQuery(`SELECT CURRENT_DATABASE();`)),
				layersWithStatsConnection,
			),
		);
		expect(statsDatabase).toStrictEqual([
			{ current_database: "connection_environments_stats_test" },
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

	test("admin connectors connect to 'postgres'", async () => {
		const layersWithDefaultConnection = migratorLayer().pipe(
			Layer.provideMerge(kyselyLayer()),
			Layer.provideMerge(pgLayer()),
			Layer.provideMerge(devPgLayer()),
			Layer.provideMerge(dbClientsLayer()),
			Layer.provideMerge(environmentLayer("development", "default")),
			Layer.provideMerge(devEnvironmentLayer("default")),
		);

		const layersWithStatsConnection = migratorLayer().pipe(
			Layer.provideMerge(kyselyLayer()),
			Layer.provideMerge(pgLayer()),
			Layer.provideMerge(devPgLayer()),
			Layer.provideMerge(dbClientsLayer()),
			Layer.provideMerge(environmentLayer("development", "stats")),
			Layer.provideMerge(devEnvironmentLayer("stats")),
		);

		const defaultDatabase = await Effect.runPromise(
			Effect.provide(
				programWithErrorCause(adminPgQuery(`SELECT CURRENT_DATABASE();`)),
				layersWithDefaultConnection,
			),
		);
		expect(defaultDatabase).toStrictEqual([{ current_database: "postgres" }]);

		const statsDatabase = await Effect.runPromise(
			Effect.provide(
				programWithErrorCause(adminPgQuery(`SELECT CURRENT_DATABASE();`)),
				layersWithStatsConnection,
			),
		);
		expect(statsDatabase).toStrictEqual([{ current_database: "postgres" }]);
	});

	test("admin environments connect to 'postgres'", async () => {
		const layersWithDefaultConnection = migratorLayer().pipe(
			Layer.provideMerge(kyselyLayer()),
			Layer.provideMerge(pgLayer()),
			Layer.provideMerge(devPgLayer()),
			Layer.provideMerge(dbClientsLayer()),
			Layer.provideMerge(environmentLayer("test", "default")),
			Layer.provideMerge(devEnvironmentLayer("default")),
		);

		const layersWithStatsConnection = migratorLayer().pipe(
			Layer.provideMerge(kyselyLayer()),
			Layer.provideMerge(pgLayer()),
			Layer.provideMerge(devPgLayer()),
			Layer.provideMerge(dbClientsLayer()),
			Layer.provideMerge(environmentLayer("test", "stats")),
			Layer.provideMerge(devEnvironmentLayer("stats")),
		);

		const defaultDatabase = await Effect.runPromise(
			Effect.provide(
				programWithErrorCause(adminPgQuery(`SELECT CURRENT_DATABASE();`)),
				layersWithDefaultConnection,
			),
		);
		expect(defaultDatabase).toStrictEqual([{ current_database: "postgres" }]);

		const statsDatabase = await Effect.runPromise(
			Effect.provide(
				programWithErrorCause(adminPgQuery(`SELECT CURRENT_DATABASE();`)),
				layersWithStatsConnection,
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

	test<ProgramContext>("default connectors connect to dev host postgres", async (context) => {
		const layers = migratorLayer().pipe(
			Layer.provideMerge(kyselyLayer()),
			Layer.provideMerge(pgLayer()),
			Layer.provideMerge(devPgLayer()),
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

	test<ProgramContext>("other connectors connect to dev host postgres", async (context) => {
		const layers = migratorLayer().pipe(
			Layer.provideMerge(kyselyLayer()),
			Layer.provideMerge(pgLayer()),
			Layer.provideMerge(devPgLayer()),
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
