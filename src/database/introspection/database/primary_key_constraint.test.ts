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
			.addPrimaryKeyConstraint("k_primary_key_test_books_kinetic_pk", [
				"id",
				"location",
			])
			.execute();
		await kysely.schema
			.createTable("test_users_pk")
			.addColumn("book_id", "integer")
			.addColumn("location_id", "integer")
			.addPrimaryKeyConstraint("k_primary_key_test_books_fk_kinetic_pk", [
				"book_id",
			])
			.execute();

		const results = await dbPrimaryKeyConstraintInfo(kysely, "public", [
			"test_demo_pk",
			"test_books_pk",
			"test_users_pk",
		]);
		if (results.status === ActionStatus.Error) {
			throw results.error;
		}

		expect(results.result).toStrictEqual({
			test_books_pk: {
				test_books_pk_id_location_kinetic_pk:
					'"test_books_pk_id_location_kinetic_pk" PRIMARY KEY ("id", "location")',
			},
			test_users_pk: {
				test_users_pk_book_id_kinetic_pk:
					'"test_users_pk_book_id_kinetic_pk" PRIMARY KEY ("book_id")',
			},
		});
	});
});
