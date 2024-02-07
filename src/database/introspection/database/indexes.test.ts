import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { ActionStatus } from "~/cli/command.js";
import { dropTables } from "~tests/helpers/dropTables.js";
import { type DbContext, globalKysely } from "~tests/setup.js";
import { dbIndexInfo } from "./indexes.js";

describe("dbIndexInfo", () => {
	beforeEach<DbContext>(async (context) => {
		context.kysely = globalKysely();
		context.tableNames = [];
		await dropTables(context);
	});

	afterEach<DbContext>(async (context) => {
		await dropTables(context);
	});

	test<DbContext>("returns info kinetic indexes", async ({
		kysely,
		tableNames,
	}) => {
		tableNames.push("indexes_test_users");
		tableNames.push("indexes_test_books");

		await kysely.schema
			.createTable("indexes_test_books")
			.addColumn("id", "integer", (column) => column.primaryKey())
			.addColumn("location", "integer")
			.execute();

		await kysely.schema
			.createIndex("indexes_test_books_location_kinetic_idx")
			.on("indexes_test_books")
			.columns(["location"])
			.execute();

		await kysely.schema
			.createTable("indexes_test_users")
			.addColumn("id", "serial")
			.addColumn("name", "text")
			.addColumn("email", "text")
			.execute();

		await kysely.schema
			.createIndex("indexes_test_users_name_email_kinetic_idx")
			.on("indexes_test_users")
			.columns(["name", "email"])
			.execute();

		const results = await dbIndexInfo(kysely, "public", [
			"indexes_test_books",
			"indexes_test_users",
		]);
		if (results.status === ActionStatus.Error) {
			throw results.error;
		}

		const expectedIndexes = {
			indexes_test_books: {
				indexes_test_books_location_kinetic_idx:
					"CREATE INDEX indexes_test_books_location_kinetic_idx ON public.indexes_test_books USING btree (location)",
			},
			indexes_test_users: {
				indexes_test_users_name_email_kinetic_idx:
					"CREATE INDEX indexes_test_users_name_email_kinetic_idx ON public.indexes_test_users USING btree (name, email)",
			},
		};
		expect(results.result).toStrictEqual(expectedIndexes);
	});

	test<DbContext>("does not return info in generated indexes", async ({
		kysely,
		tableNames,
	}) => {
		tableNames.push("indexes_test_books_generated");

		await kysely.schema
			.createTable("indexes_test_books_generated")
			.addColumn("id", "integer", (column) => column.primaryKey())
			.addColumn("name", "integer", (column) => column.unique())
			.addColumn("location", "integer")
			.execute();

		const results = await dbIndexInfo(kysely, "public", ["indexes_test_books"]);

		if (results.status === ActionStatus.Error) {
			throw results.error;
		}

		const expectedIndexes = {};

		expect(results.result).toStrictEqual(expectedIndexes);
	});
});
