import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { ActionStatus } from "~/cli/command.js";
import { dropTables } from "~tests/helpers/dropTables.js";
import { type DbContext, globalKysely } from "~tests/setup.js";
import { dbForeignKeyConstraintInfo } from "./foreign_key_constraint.js";

describe("dbForeignKeyConstraintInfo", () => {
	beforeEach<DbContext>(async (context) => {
		context.kysely = globalKysely();
		context.tableNames = [];
		await dropTables(context);
	});

	afterEach<DbContext>(async (context) => {
		await dropTables(context);
	});

	test<DbContext>("returns info foreign key constraints", async ({
		kysely,
		tableNames,
	}) => {
		tableNames.push("test_users_fk");
		tableNames.push("test_books_fk");
		await kysely.schema
			.createTable("test_books_fk")
			.addColumn("id", "integer")
			.addColumn("location", "integer")
			.addPrimaryKeyConstraint("k_primary_key_test_books_fk", [
				"id",
				"location",
			])
			.execute();
		await kysely.schema
			.createTable("test_users_fk")
			.addColumn("book_id", "integer")
			.addColumn("location_id", "integer")
			.addForeignKeyConstraint(
				"k_fk_constraint_test_users_book_id_kinetic_fkey",
				["book_id", "location_id"],
				"test_books_fk",
				["id", "location"],
			)
			.execute();

		const table_1_results = await dbForeignKeyConstraintInfo(kysely, "public");
		if (table_1_results.status === ActionStatus.Error) {
			throw table_1_results.error;
		}

		expect(table_1_results.result).toStrictEqual([
			{
				constraintType: "FOREIGN KEY",
				table: "test_users_fk",
				column: ["book_id", "location_id"],
				targetTable: "test_books_fk",
				targetColumns: ["id", "location"],
				updateRule: "NO ACTION",
				deleteRule: "NO ACTION",
			},
		]);
	});
});
