import { ChangesetGeneratorState } from "@monorepo/pg/changeset/changeset-generator.js";
import { seed } from "@monorepo/programs/database/seed.js";
import { TableRenameState } from "@monorepo/programs/table-renames.js";
import { Effect } from "effect";
import { unlinkSync, writeFileSync } from "fs";
import path from "path";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { programWithContextAndServices } from "~tests/__setup__/helpers/run-program.js";
import {
	setupProgramContext,
	teardownProgramContext,
	type ProgramContext,
} from "~tests/__setup__/helpers/test-context.js";

describe("seed", () => {
	beforeEach<ProgramContext>(async (context) => {
		await setupProgramContext(context);
	});

	afterEach<ProgramContext>(async (context) => {
		await teardownProgramContext(context);
	});

	test<ProgramContext>("seeds database", async (context) => {
		await context.migrator.migrateToLatest();

		await Effect.runPromise(
			await programWithContextAndServices(
				ChangesetGeneratorState.provide(TableRenameState.provide(seed({}))),
			),
		);
		await Effect.runPromise(
			await programWithContextAndServices(
				ChangesetGeneratorState.provide(TableRenameState.provide(seed({}))),
			),
		);

		const result = await context.kysely
			.selectFrom("regulus_mint")
			.select("name")
			.execute();

		const expected = [{ name: "test1" }, { name: "test1" }];
		expect(result).toStrictEqual(expected);
	});

	test<ProgramContext>("seeds database with replant", async (context) => {
		await context.migrator.migrateToLatest();

		await Effect.runPromise(
			await programWithContextAndServices(
				ChangesetGeneratorState.provide(TableRenameState.provide(seed({}))),
			),
		);
		await Effect.runPromise(
			await programWithContextAndServices(
				ChangesetGeneratorState.provide(
					TableRenameState.provide(
						seed({ replant: true, disableWarnings: true }),
					),
				),
			),
		);

		const result = await context.kysely
			.selectFrom("regulus_mint")
			.select("name")
			.execute();

		const expected = [{ name: "test1" }];
		expect(result).toEqual(expected);
	});

	test<ProgramContext>("fails with pending schema migrations", async () => {
		expect(
			async () =>
				await Effect.runPromise(
					await programWithContextAndServices(
						ChangesetGeneratorState.provide(TableRenameState.provide(seed({}))),
					),
				),
		).rejects.toThrowError();
	});

	test<ProgramContext>("exits with missing databases.ts", async (context) => {
		await context.migrator.migrateToLatest();

		unlinkSync(path.join(context.folder, "db", "databases.ts"));

		expect(
			async () =>
				await Effect.runPromise(
					await programWithContextAndServices(
						ChangesetGeneratorState.provide(TableRenameState.provide(seed({}))),
					),
				),
		).rejects.toThrowError('process.exit unexpectedly called with "1"');
	});

	test<ProgramContext>("fails with seeded function missing", async (context) => {
		await context.migrator.migrateToLatest();

		writeFileSync(path.join(context.folder, "db", "seeds.ts"), "");

		expect(
			async () =>
				await Effect.runPromise(
					await programWithContextAndServices(
						ChangesetGeneratorState.provide(TableRenameState.provide(seed({}))),
					),
				),
		).rejects.toThrowError();
	});
});
