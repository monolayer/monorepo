import { Effect, Ref } from "effect";
import type { Equal, Expect } from "type-testing";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { loadEnv } from "~/cli/cli-action.js";
import { type MonolayerMigrationInfo } from "~/migrations/migration.js";
import { AppEnvironment } from "~/state/app-environment.js";
import { layers } from "~tests/__setup__/helpers/layers.js";
import { programWithErrorCause } from "~tests/__setup__/helpers/run-program.js";
import {
	setupProgramContext,
	teardownProgramContext,
	type ProgramContext,
} from "~tests/__setup__/helpers/test-context.js";
import { Migrator } from "../../src/services/migrator.js";

describe("allMigrations", () => {
	beforeEach<ProgramContext>(async (context) => {
		await setupProgramContext(context);
	});

	afterEach<ProgramContext>(async (context) => {
		await teardownProgramContext(context);
	});

	test<ProgramContext>("returns all migrations", async (context) => {
		await context.migrator.migrateUp();
		await context.migrator.migrateUp();
		await context.kysely.destroy();

		const allMigrations = Effect.gen(function* () {
			const migrator = yield* Migrator;
			return yield* migrator.all;
		});

		const program = Effect.provideServiceEffect(
			Effect.provide(programWithErrorCause(allMigrations), layers),
			AppEnvironment,
			Ref.make(await loadEnv("development", "default")),
		);

		const result = await Effect.runPromise(program);

		type resultType = typeof result;
		type Expected = MonolayerMigrationInfo[];
		const isEqual: Expect<Equal<resultType, Expected>> = true;
		expect(isEqual).toBe(true);

		expect(result.length).toEqual(4);
		expect(result[0]!.name).toEqual("20240405T120024-regulus-mint");
		expect(result[0]!.executedAt).not.toBeUndefined();
		expect(result[1]!.name).toEqual("20240405T120250-canopus-teal");
		expect(result[1]!.executedAt).not.toBeUndefined();
		expect(result[2]!.name).toEqual("20240405T153857-alphard-black");
		expect(result[2]!.executedAt).toBeUndefined();
		expect(result[3]!.name).toEqual("20240405T154913-mirfak-mustard");
		expect(result[3]!.executedAt).toBeUndefined();
	});
});
