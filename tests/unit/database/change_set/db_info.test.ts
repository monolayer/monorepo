import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { dbIndexInfo } from "~/database/change_set/db_info.js";
import { DbContext, globalKysely } from "~tests/setup.js";

async function dropTables(context: DbContext) {
	try {
		for (const tableName of context.tableNames) {
			await context.kysely.schema.dropTable(tableName).execute();
		}
	} catch {}
}
describe("db info", () => {
	beforeEach<DbContext>(async (context) => {
		context.kysely = globalKysely();
		context.tableNames = [];
		await dropTables(context);
	});

	afterEach<DbContext>(async (context) => {
		await dropTables(context);
	});

	describe("#dbIndexInfo", () => {
		it<DbContext>("returns info on table indexes", async ({
			kysely,
			tableNames,
		}) => {
			tableNames.push("test_indexes_1");
			tableNames.push("test_indexes_2");

			await kysely.schema
				.createTable("test_indexes_1")
				.addColumn("id", "serial")
				.addColumn("name", "text")
				.execute();

			await kysely.schema
				.createIndex("test_indexes_1_index_on_id")
				.on("test_indexes_1")
				.column("id")
				.execute();

			await kysely.schema
				.createIndex("test_indexes_1_index_on_name")
				.on("test_indexes_1")
				.column("name")
				.nullsNotDistinct()
				.execute();

			await kysely.schema
				.createIndex("test_indexes_1_index_on_id_and_name")
				.on("test_indexes_1")
				.columns(["id", "name"])
				.unique()
				.ifNotExists()
				.execute();

			await kysely.schema
				.createTable("test_indexes_2")
				.addColumn("id", "serial")
				.addColumn("email", "text")
				.execute();

			await kysely.schema
				.createIndex("test_indexes_2_index_on_id")
				.on("test_indexes_2")
				.column("id")
				.execute();

			await kysely.schema
				.createIndex("test_indexes_2_index_on_email")
				.on("test_indexes_2")
				.column("email")
				.execute();

			await kysely.schema
				.createIndex("test_indexes_2_index_on_id_and_email")
				.on("test_indexes_2")
				.columns(["id", "email"])
				.unique()
				.ifNotExists()
				.execute();

			const results = await dbIndexInfo(kysely, "public", [
				"test_indexes_1",
				"test_indexes_2",
			]);
			expect(results).toStrictEqual({
				test_indexes_1: {
					test_indexes_1_index_on_id:
						"CREATE INDEX test_indexes_1_index_on_id ON public.test_indexes_1 USING btree (id)",
					test_indexes_1_index_on_name:
						"CREATE INDEX test_indexes_1_index_on_name ON public.test_indexes_1 USING btree (name) NULLS NOT DISTINCT",
					test_indexes_1_index_on_id_and_name:
						"CREATE UNIQUE INDEX test_indexes_1_index_on_id_and_name ON public.test_indexes_1 USING btree (id, name)",
				},
				test_indexes_2: {
					test_indexes_2_index_on_id:
						"CREATE INDEX test_indexes_2_index_on_id ON public.test_indexes_2 USING btree (id)",
					test_indexes_2_index_on_email:
						"CREATE INDEX test_indexes_2_index_on_email ON public.test_indexes_2 USING btree (email)",
					test_indexes_2_index_on_id_and_email:
						"CREATE UNIQUE INDEX test_indexes_2_index_on_id_and_email ON public.test_indexes_2 USING btree (id, email)",
				},
			});
		});
	});
});
