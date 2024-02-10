import { sql } from "kysely";
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
			.createIndex("indexes_test_books_location_kntc_idx")
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
			.createIndex("indexes_test_users_name_email_kntc_idx")
			.on("indexes_test_users")
			.columns(["name", "email"])
			.execute();

		await sql`COMMENT ON INDEX indexes_test_books_location_kntc_idx IS '1234';COMMENT ON INDEX indexes_test_users_name_email_kntc_idx IS 'abcd'`.execute(
			kysely,
		);

		const results = await dbIndexInfo(kysely, "public", [
			"indexes_test_books",
			"indexes_test_users",
		]);
		if (results.status === ActionStatus.Error) {
			throw results.error;
		}

		const expectedIndexes = {
			indexes_test_books: {
				indexes_test_books_location_kntc_idx:
					"1234:CREATE INDEX indexes_test_books_location_kntc_idx ON public.indexes_test_books USING btree (location)",
			},
			indexes_test_users: {
				indexes_test_users_name_email_kntc_idx:
					"abcd:CREATE INDEX indexes_test_users_name_email_kntc_idx ON public.indexes_test_users USING btree (name, email)",
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

	test<DbContext>("returns info on indexes with using", async ({
		kysely,
		tableNames,
	}) => {
		tableNames.push("indexes_using");

		await kysely.schema
			.createTable("indexes_using")
			.addColumn("name", "text")
			.addColumn("email", "text")
			.execute();

		await kysely.schema
			.createIndex("indexes_using_users_name_kntc_idx")
			.on("indexes_using")
			.columns(["name"])
			.using("hash")
			.execute();

		await sql`COMMENT ON INDEX indexes_using_users_name_kntc_idx IS 'abcd'`.execute(
			kysely,
		);

		const results = await dbIndexInfo(kysely, "public", ["indexes_using"]);
		if (results.status === ActionStatus.Error) {
			throw results.error;
		}

		const expectedIndexes = {
			indexes_using: {
				indexes_using_users_name_kntc_idx:
					"abcd:CREATE INDEX indexes_using_users_name_kntc_idx ON public.indexes_using USING hash (name)",
			},
		};
		expect(results.result).toStrictEqual(expectedIndexes);
	});

	test<DbContext>("returns info on unique indexes", async ({
		kysely,
		tableNames,
	}) => {
		tableNames.push("indexes_unique");

		await kysely.schema
			.createTable("indexes_unique")
			.addColumn("name", "text")
			.addColumn("email", "text")
			.execute();

		await kysely.schema
			.createIndex("indexes_unique_users_name_email_kntc_idx")
			.on("indexes_unique")
			.columns(["name", "email"])
			.unique()
			.execute();

		await sql`COMMENT ON INDEX indexes_unique_users_name_email_kntc_idx IS 'abcd'`.execute(
			kysely,
		);

		const results = await dbIndexInfo(kysely, "public", ["indexes_unique"]);
		if (results.status === ActionStatus.Error) {
			throw results.error;
		}

		const expectedIndexes = {
			indexes_unique: {
				indexes_unique_users_name_email_kntc_idx:
					"abcd:CREATE UNIQUE INDEX indexes_unique_users_name_email_kntc_idx ON public.indexes_unique USING btree (name, email)",
			},
		};
		expect(results.result).toStrictEqual(expectedIndexes);
	});

	test<DbContext>("returns info on indexes with nulls not distinct", async ({
		kysely,
		tableNames,
	}) => {
		tableNames.push("indexes_nulls_not_distinct");

		await kysely.schema
			.createTable("indexes_nulls_not_distinct")
			.addColumn("name", "text")
			.addColumn("email", "text")
			.execute();

		await kysely.schema
			.createIndex("indexes_nulls_not_distinct_users_name_email_kntc_idx")
			.on("indexes_nulls_not_distinct")
			.columns(["name", "email"])
			.nullsNotDistinct()
			.execute();

		await sql`COMMENT ON INDEX indexes_nulls_not_distinct_users_name_email_kntc_idx IS 'abcd'`.execute(
			kysely,
		);

		const results = await dbIndexInfo(kysely, "public", [
			"indexes_nulls_not_distinct",
		]);
		if (results.status === ActionStatus.Error) {
			throw results.error;
		}

		const expectedIndexes = {
			indexes_nulls_not_distinct: {
				indexes_nulls_not_distinct_users_name_email_kntc_idx:
					"abcd:CREATE INDEX indexes_nulls_not_distinct_users_name_email_kntc_idx ON public.indexes_nulls_not_distinct USING btree (name, email) NULLS NOT DISTINCT",
			},
		};
		expect(results.result).toStrictEqual(expectedIndexes);
	});

	test<DbContext>("returns info on indexes with where clause", async ({
		kysely,
		tableNames,
	}) => {
		tableNames.push("indexes_where");

		await kysely.schema
			.createTable("indexes_where")
			.addColumn("name", "text")
			.addColumn("email", "text")
			.addColumn("order_nr", "text")
			.execute();

		await kysely.schema
			.createIndex("indexes_where_name_email_kntc_idx")
			.on("indexes_where")
			.columns(["order_nr", "email"])
			.where("order_nr", "like", "123%")
			.execute();

		await sql`COMMENT ON INDEX indexes_where_name_email_kntc_idx IS 'abcd'`.execute(
			kysely,
		);

		const results = await dbIndexInfo(kysely, "public", ["indexes_where"]);
		if (results.status === ActionStatus.Error) {
			throw results.error;
		}

		const expectedIndexes = {
			indexes_where: {
				indexes_where_name_email_kntc_idx:
					"abcd:CREATE INDEX indexes_where_name_email_kntc_idx ON public.indexes_where USING btree (order_nr, email) WHERE (order_nr ~~ '123%'::text)",
			},
		};
		expect(results.result).toStrictEqual(expectedIndexes);
	});
});
