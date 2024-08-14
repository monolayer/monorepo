import { adminPgQuery, pgQuery } from "@monorepo/services/db-clients.js";
import dotenv from "dotenv";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { loadEnv } from "~/cli-action.js";
import { runProgramWithErrorCause } from "~tests/__setup__/helpers/run-program.js";
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

	test<ProgramContext>("default configuration", async () => {
		expect(await currentDatabase("default")).toStrictEqual([
			{ current_database: "fa8238c1" },
		]);
	});

	test<ProgramContext>("other configuration", async (context) => {
		process.env.MONO_PG_STATS_DATABASE_URL = `postgresql://postgres:postgres@localhost:5440/${context.dbName}_stats`;

		expect(await currentDatabase("stats")).toStrictEqual([
			{ current_database: "83251755_stats" },
		]);
	});

	test("admin configurations connect to 'postgres'", async () => {
		expect(await currentDatabaseAsAdmin("default")).toStrictEqual([
			{ current_database: "postgres" },
		]);

		expect(await currentDatabaseAsAdmin("stats")).toStrictEqual([
			{ current_database: "postgres" },
		]);

		expect(await currentDatabaseAsAdmin("default")).toStrictEqual([
			{ current_database: "postgres" },
		]);

		expect(await currentDatabaseAsAdmin("stats")).toStrictEqual([
			{ current_database: "postgres" },
		]);
	});
});

async function currentDatabase(databaseId: string) {
	return await runProgramWithErrorCause(
		pgQuery(`SELECT CURRENT_DATABASE();`),
		await loadEnv({ databaseId }),
	);
}

async function currentDatabaseAsAdmin(databaseId: string) {
	return await runProgramWithErrorCause(
		adminPgQuery(`SELECT CURRENT_DATABASE();`),
		await loadEnv({ databaseId }),
	);
}
