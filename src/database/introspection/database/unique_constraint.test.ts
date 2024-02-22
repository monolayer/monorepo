import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { ActionStatus } from "~/cli/command.js";
import { dropTables } from "~tests/helpers/dropTables.js";
import { type DbContext, globalKysely } from "~tests/setup.js";
import { dbUniqueConstraintInfo } from "./unique_constraint.js";

describe("#dbUniqueConstraintInfo", () => {
	beforeEach<DbContext>(async (context) => {
		context.kysely = globalKysely();
		context.tableNames = [];
		await dropTables(context);
	});

	afterEach<DbContext>(async (context) => {
		await dropTables(context);
	});

	test<DbContext>("#dbUniqueConstraintInfo returns info unique constraints", async ({
		kysely,
		tableNames,
	}) => {
		tableNames.push("unique_constraint_test");
		await kysely.schema
			.createTable("unique_constraint_test")
			.addColumn("price", "integer", (col) => col.unique())
			.addColumn("demo", "integer", (col) => col.unique().nullsNotDistinct())
			.addColumn("name", "text", (col) => col.unique())
			.addUniqueConstraint(
				"k_unique_constraint_price_demo_kinetic_key",
				["price", "demo"],
				(builder) => builder.nullsNotDistinct(),
			)
			.addUniqueConstraint("k_unique_constraint_demo_name_kinetic_key", [
				"demo",
				"name",
			])
			.execute();
		const table_1_results = await dbUniqueConstraintInfo(kysely, "public", [
			"unique_constraint_test",
		]);
		if (table_1_results.status === ActionStatus.Error) {
			throw table_1_results.error;
		}
		expect(table_1_results.result).toStrictEqual({
			unique_constraint_test: {
				unique_constraint_test_demo_name_kinetic_key:
					'"unique_constraint_test_demo_name_kinetic_key" UNIQUE NULLS DISTINCT ("demo", "name")',
				unique_constraint_test_demo_price_kinetic_key:
					'"unique_constraint_test_demo_price_kinetic_key" UNIQUE NULLS NOT DISTINCT ("demo", "price")',
			},
		});
	});
});
