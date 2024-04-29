import { Effect } from "effect";
import { sql } from "kysely";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { dropTablesAndTypes } from "~/database/drop-tables-and-types.js";
import { layers } from "~tests/__setup__/helpers/layers.js";
import { programWithErrorCause } from "~tests/__setup__/helpers/run-program.js";
import {
	setupProgramContext,
	teardownProgramContext,
	type ProgramContext,
} from "~tests/__setup__/helpers/test-context.js";

describe("drop tables and types", () => {
	beforeEach<ProgramContext>(async (context) => {
		await setupProgramContext(context);
	});

	afterEach<ProgramContext>(async (context) => {
		await teardownProgramContext(context);
	});

	test<ProgramContext>("drops all tables except kysely tables ", async (context) => {
		await context.migrator.migrateToLatest();

		const allTables = context.kysely
			.selectFrom("information_schema.tables")
			.where("table_schema", "=", "public")
			.where("table_catalog", "=", context.dbName)
			.select("table_name")
			.orderBy("table_name");

		expect(await allTables.execute()).toStrictEqual([
			{ table_name: "alphard_black" },
			{ table_name: "kysely_migration" },
			{ table_name: "kysely_migration_lock" },
			{ table_name: "mirfak_mustart" },
			{ table_name: "regulur_door" },
			{ table_name: "regulus_mint" },
		]);

		await Effect.runPromise(Effect.provide(dropTablesAndTypes(), layers));

		expect(await allTables.execute()).toStrictEqual([
			{ table_name: "kysely_migration" },
			{ table_name: "kysely_migration_lock" },
		]);
	});

	test<ProgramContext>("truncates kysely tables", async (context) => {
		await context.migrator.migrateToLatest();

		const nameCount = context.kysely
			.selectFrom("kysely_migration")
			.select((eb) => eb.fn.count("name").distinct().as("name_count"));

		expect(await nameCount.executeTakeFirst()).toStrictEqual({
			name_count: "4",
		});

		await Effect.runPromise(
			Effect.provide(programWithErrorCause(dropTablesAndTypes()), layers),
		);

		expect(await nameCount.executeTakeFirst()).toStrictEqual({
			name_count: "0",
		});
	});

	test<ProgramContext>("drops types", async (context) => {
		await context.migrator.migrateUp();

		await context.kysely.schema
			.createType("role")
			.asEnum(["admin", "user"])
			.execute();

		const addRoleColumn = context.kysely.schema
			.alterTable("regulus_mint")
			.addColumn("role", sql`role`);

		await addRoleColumn.execute();

		await Effect.runPromise(
			Effect.provide(programWithErrorCause(dropTablesAndTypes()), layers),
		);

		await context.migrator.migrateUp();

		await expect(
			async () => await addRoleColumn.execute(),
		).rejects.toThrowError('type "role" does not exist');
	});
});
