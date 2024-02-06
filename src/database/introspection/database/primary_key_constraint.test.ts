import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { ActionStatus } from "~/cli/command.js";
import { dropTables } from "~tests/helpers/dropTables.js";
import { type DbContext, globalKysely } from "~tests/setup.js";
import { dbPrimaryKeyConstraintInfo } from "./primary_key_constraint.js";

describe("dbPrimaryKeyConstraintInfo", () => {
	beforeEach<DbContext>(async (context) => {
		context.kysely = globalKysely();
		context.tableNames = [];
		await dropTables(context);
	});

	afterEach<DbContext>(async (context) => {
		await dropTables(context);
	});

	test<DbContext>("returns info primary key constraints", async ({
		kysely,
		tableNames,
	}) => {
		tableNames.push("test_users_pk");
		tableNames.push("test_books_pk");
		tableNames.push("test_demo_pk");
		await kysely.schema
			.createTable("test_demo_pk")
			.addColumn("id", "integer", (column) => column.primaryKey())
			.execute();

		await kysely.schema
			.createTable("test_books_pk")
			.addColumn("id", "integer")
			.addColumn("location", "integer")
			.addPrimaryKeyConstraint("k_primary_key_test_books_kinetic_pkey", [
				"id",
				"location",
			])
			.execute();
		await kysely.schema
			.createTable("test_users_pk")
			.addColumn("book_id", "integer")
			.addColumn("location_id", "integer")
			.addPrimaryKeyConstraint("k_primary_key_test_books_fk_kinetic_pkey", [
				"book_id",
			])
			.execute();

		const results = await dbPrimaryKeyConstraintInfo(kysely, "public");
		if (results.status === ActionStatus.Error) {
			throw results.error;
		}

		expect(results.result).toStrictEqual([
			{
				constraintType: "PRIMARY KEY",
				table: "test_books_pk",
				columns: ["id", "location"],
			},
			{
				constraintType: "PRIMARY KEY",
				table: "test_users_pk",
				columns: ["book_id"],
			},
		]);
	});
});