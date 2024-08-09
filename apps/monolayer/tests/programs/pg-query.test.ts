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

	test("configurations", async () => {
		expect(await currentDatabase("development", "default")).toStrictEqual([
			{ current_database: "d7e08363" },
		]);

		expect(await currentDatabase("development", "stats")).toStrictEqual([
			{ current_database: "d7e08363_stats" },
		]);
	});

	test("configuration connections", async () => {
		expect(await currentDatabase("test", "default")).toStrictEqual([
			{ current_database: "1d6addc0_test" },
		]);

		expect(await currentDatabase("test", "stats")).toStrictEqual([
			{ current_database: "1d6addc0_stats_test" },
		]);
	});

	test("admin configurations connect to 'postgres'", async () => {
		expect(
			await currentDatabaseAsAdmin("development", "default"),
		).toStrictEqual([{ current_database: "postgres" }]);

		expect(await currentDatabaseAsAdmin("development", "stats")).toStrictEqual([
			{ current_database: "postgres" },
		]);

		expect(await currentDatabaseAsAdmin("test", "default")).toStrictEqual([
			{ current_database: "postgres" },
		]);

		expect(await currentDatabaseAsAdmin("test", "stats")).toStrictEqual([
			{ current_database: "postgres" },
		]);
	});
});

async function currentDatabase(environment: string, connection: string) {
	return await runProgramWithErrorCause(
		pgQuery(`SELECT CURRENT_DATABASE();`),
		await loadEnv({ connection: environment, name: connection }),
	);
}

async function currentDatabaseAsAdmin(environment: string, connection: string) {
	return await runProgramWithErrorCause(
		adminPgQuery(`SELECT CURRENT_DATABASE();`),
		await loadEnv({ connection: environment, name: connection }),
	);
}
