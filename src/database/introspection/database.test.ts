import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ActionStatus } from "~/cli/command.js";
import {
	dbColumnInfo,
	dbTableInfo,
} from "~/database/introspection/database.js";
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

	describe("#dbTableInfo", () => {
		it<DbContext>("returns info on all tables", async ({
			kysely,
			tableNames,
		}) => {
			tableNames.push("table_info1");
			tableNames.push("table_info2");
			tableNames.push("table_info3");
			await kysely.schema.createTable("table_info1").execute();
			await kysely.schema.createTable("table_info2").execute();
			await kysely.schema.createTable("table_info3").execute();
			const results = await dbTableInfo(kysely, "public");
			if (results.status === ActionStatus.Error) {
				throw results.error;
			}
			const allResults = results.result;
			const hasTableInfo1 = allResults.some(
				(element) =>
					element.name === "table_info1" && element.schemaName === "public",
			);
			expect(hasTableInfo1).toBe(true);
			const hasTableInfo2 = allResults.some(
				(element) =>
					element.name === "table_info2" && element.schemaName === "public",
			);
			expect(hasTableInfo2).toBe(true);
			const hasTableInfo3 = allResults.some(
				(element) =>
					element.name === "table_info3" && element.schemaName === "public",
			);
			expect(hasTableInfo3).toBe(true);
		});
	});

	describe("#dbColumnInfo", () => {
		it<DbContext>("returns empty columns info when tables names are not supplied", async ({
			kysely,
		}) => {
			const emptyResults = await dbColumnInfo(kysely, "public", []);
			if (emptyResults.status === ActionStatus.Error) {
				throw emptyResults.error;
			}
			expect(emptyResults.result).toStrictEqual({});
		});

		it<DbContext>("returns info on columns with numeric data types", async ({
			kysely,
			tableNames,
		}) => {
			tableNames.push("numeric_table_1");
			tableNames.push("numeric_table_2");
			await kysely.schema
				.createTable("numeric_table_1")
				.addColumn("numeric", "numeric")
				.addColumn("decimal", "decimal")
				.execute();
			await kysely.schema
				.createTable("numeric_table_2")
				.addColumn("decimal_with_precision", "numeric(6, 0)", (col) =>
					col.defaultTo(12.3),
				)
				.addColumn("decimal_with_precision_and_scale", "numeric(6, 2)")
				.addColumn("numeric_with_precision", "numeric(6, 0)")
				.addColumn("numeric_with_precision_and_scale", "numeric(6, 2)")
				.execute();
			const table_1_results = await dbColumnInfo(kysely, "public", [
				"numeric_table_1",
			]);
			if (table_1_results.status === ActionStatus.Error) {
				throw table_1_results.error;
			}
			expect(table_1_results.result).toStrictEqual({
				numeric_table_1: {
					decimal: {
						tableName: "numeric_table_1",
						columnName: "decimal",
						dataType: "numeric",
						defaultValue: null,
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						characterMaximumLength: null,
						datetimePrecision: null,
						renameFrom: null,
						primaryKey: null,
						foreignKeyConstraint: null,
					},
					numeric: {
						tableName: "numeric_table_1",
						columnName: "numeric",
						dataType: "numeric",
						defaultValue: null,
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						characterMaximumLength: null,
						datetimePrecision: null,
						renameFrom: null,
						primaryKey: null,
						foreignKeyConstraint: null,
					},
				},
			});
			const table_2_results = await dbColumnInfo(kysely, "public", [
				"numeric_table_2",
			]);
			if (table_2_results.status === ActionStatus.Error) {
				throw table_2_results.error;
			}
			expect(table_2_results.result).toStrictEqual({
				numeric_table_2: {
					decimal_with_precision: {
						tableName: "numeric_table_2",
						columnName: "decimal_with_precision",
						dataType: "numeric(6, 0)",
						defaultValue: "12.3",
						isNullable: true,
						numericPrecision: 6,
						numericScale: 0,
						characterMaximumLength: null,
						datetimePrecision: null,
						renameFrom: null,
						primaryKey: null,
						foreignKeyConstraint: null,
					},
					decimal_with_precision_and_scale: {
						tableName: "numeric_table_2",
						columnName: "decimal_with_precision_and_scale",
						dataType: "numeric(6, 2)",
						defaultValue: null,
						isNullable: true,
						numericPrecision: 6,
						numericScale: 2,
						characterMaximumLength: null,
						datetimePrecision: null,
						renameFrom: null,
						primaryKey: null,
						foreignKeyConstraint: null,
					},
					numeric_with_precision: {
						tableName: "numeric_table_2",
						columnName: "numeric_with_precision",
						dataType: "numeric(6, 0)",
						defaultValue: null,
						isNullable: true,
						numericPrecision: 6,
						numericScale: 0,
						characterMaximumLength: null,
						datetimePrecision: null,
						renameFrom: null,
						primaryKey: null,
						foreignKeyConstraint: null,
					},
					numeric_with_precision_and_scale: {
						tableName: "numeric_table_2",
						columnName: "numeric_with_precision_and_scale",
						dataType: "numeric(6, 2)",
						defaultValue: null,
						isNullable: true,
						numericPrecision: 6,
						numericScale: 2,
						characterMaximumLength: null,
						datetimePrecision: null,
						renameFrom: null,
						primaryKey: null,
						foreignKeyConstraint: null,
					},
				},
			});
		});

		it<DbContext>("returns info on column with integer data types", async ({
			kysely,
			tableNames,
		}) => {
			tableNames.push("integer_table_1");
			tableNames.push("integer_table_2");
			await kysely.schema
				.createTable("integer_table_1")
				.addColumn("int2", "int2")
				.addColumn("int4", "int4")
				.addColumn("integer", "integer")
				.addColumn("int8", "int8")
				.addColumn("bigint", "bigint")
				.execute();
			const results = await dbColumnInfo(kysely, "public", ["integer_table_1"]);
			if (results.status === ActionStatus.Error) {
				throw results.error;
			}
			expect(results.result).toStrictEqual({
				integer_table_1: {
					bigint: {
						tableName: "integer_table_1",
						columnName: "bigint",
						dataType: "bigint",
						defaultValue: null,
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						characterMaximumLength: null,
						datetimePrecision: null,
						renameFrom: null,
						primaryKey: null,
						foreignKeyConstraint: null,
					},
					int2: {
						tableName: "integer_table_1",
						columnName: "int2",
						dataType: "int2",
						defaultValue: null,
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						characterMaximumLength: null,
						datetimePrecision: null,
						renameFrom: null,
						primaryKey: null,
						foreignKeyConstraint: null,
					},
					int4: {
						tableName: "integer_table_1",
						columnName: "int4",
						dataType: "integer",
						defaultValue: null,
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						characterMaximumLength: null,
						datetimePrecision: null,
						renameFrom: null,
						primaryKey: null,
						foreignKeyConstraint: null,
					},
					int8: {
						tableName: "integer_table_1",
						columnName: "int8",
						dataType: "bigint",
						defaultValue: null,
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						characterMaximumLength: null,
						datetimePrecision: null,
						renameFrom: null,
						primaryKey: null,
						foreignKeyConstraint: null,
					},
					integer: {
						tableName: "integer_table_1",
						columnName: "integer",
						dataType: "integer",
						defaultValue: null,
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						characterMaximumLength: null,
						datetimePrecision: null,
						renameFrom: null,
						primaryKey: null,
						foreignKeyConstraint: null,
					},
				},
			});
		});

		it<DbContext>("returns info on column with arbitrary precision data types", async ({
			kysely,
			tableNames,
		}) => {
			tableNames.push("float_table_1");
			tableNames.push("float_table_2");
			await kysely.schema
				.createTable("float_table_1")
				.addColumn("double_precision", "double precision")
				.addColumn("float4", "float4")
				.addColumn("float8", "float8")
				.addColumn("real", "real")
				.execute();
			const results = await dbColumnInfo(kysely, "public", ["float_table_1"]);
			if (results.status === ActionStatus.Error) {
				throw results.error;
			}
			expect(results.result).toStrictEqual({
				float_table_1: {
					double_precision: {
						tableName: "float_table_1",
						columnName: "double_precision",
						dataType: "double precision",
						defaultValue: null,
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						characterMaximumLength: null,
						datetimePrecision: null,
						renameFrom: null,
						primaryKey: null,
						foreignKeyConstraint: null,
					},
					float4: {
						tableName: "float_table_1",
						columnName: "float4",
						dataType: "real",
						defaultValue: null,
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						characterMaximumLength: null,
						datetimePrecision: null,
						renameFrom: null,
						primaryKey: null,
						foreignKeyConstraint: null,
					},
					float8: {
						tableName: "float_table_1",
						columnName: "float8",
						dataType: "double precision",
						defaultValue: null,
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						characterMaximumLength: null,
						datetimePrecision: null,
						renameFrom: null,
						primaryKey: null,
						foreignKeyConstraint: null,
					},
					real: {
						tableName: "float_table_1",
						columnName: "real",
						dataType: "real",
						defaultValue: null,
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						characterMaximumLength: null,
						datetimePrecision: null,
						renameFrom: null,
						primaryKey: null,
						foreignKeyConstraint: null,
					},
				},
			});
		});

		it<DbContext>("returns info on column with serial data types", async ({
			kysely,
			tableNames,
		}) => {
			tableNames.push("serial_table_1");
			tableNames.push("serial_table_2");
			await kysely.schema
				.createTable("serial_table_1")
				.addColumn("serial", "serial")
				.addColumn("bigserial", "bigserial")
				.execute();
			const results = await dbColumnInfo(kysely, "public", ["serial_table_1"]);
			if (results.status === ActionStatus.Error) {
				throw results.error;
			}
			expect(results.result).toStrictEqual({
				serial_table_1: {
					bigserial: {
						tableName: "serial_table_1",
						columnName: "bigserial",
						dataType: "bigserial",
						defaultValue: null,
						isNullable: false,
						numericPrecision: null,
						numericScale: null,
						characterMaximumLength: null,
						datetimePrecision: null,
						renameFrom: null,
						primaryKey: null,
						foreignKeyConstraint: null,
					},
					serial: {
						tableName: "serial_table_1",
						columnName: "serial",
						dataType: "serial",
						defaultValue: null,
						isNullable: false,
						numericPrecision: null,
						numericScale: null,
						characterMaximumLength: null,
						datetimePrecision: null,
						renameFrom: null,
						primaryKey: null,
						foreignKeyConstraint: null,
					},
				},
			});
		});

		it<DbContext>("returns info on column with miscellaneous data types", async ({
			kysely,
			tableNames,
		}) => {
			tableNames.push("misc_table_1");
			tableNames.push("misc_table_2");
			await kysely.schema
				.createTable("misc_table_1")
				.addColumn("json", "json")
				.addColumn("jsonb", "jsonb")
				.addColumn("date", "date")
				.addColumn("bytea", "bytea")
				.addColumn("boolean", "boolean")
				.addColumn("uuid", "uuid")
				.execute();
			const results = await dbColumnInfo(kysely, "public", ["misc_table_1"]);
			if (results.status === ActionStatus.Error) {
				throw results.error;
			}
			expect(results.result).toStrictEqual({
				misc_table_1: {
					boolean: {
						tableName: "misc_table_1",
						columnName: "boolean",
						dataType: "boolean",
						defaultValue: null,
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						characterMaximumLength: null,
						datetimePrecision: null,
						renameFrom: null,
						primaryKey: null,
						foreignKeyConstraint: null,
					},
					bytea: {
						tableName: "misc_table_1",
						columnName: "bytea",
						dataType: "bytea",
						defaultValue: null,
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						characterMaximumLength: null,
						datetimePrecision: null,
						renameFrom: null,
						primaryKey: null,
						foreignKeyConstraint: null,
					},
					date: {
						tableName: "misc_table_1",
						columnName: "date",
						dataType: "date",
						defaultValue: null,
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						characterMaximumLength: null,
						datetimePrecision: null,
						renameFrom: null,
						primaryKey: null,
						foreignKeyConstraint: null,
					},
					json: {
						tableName: "misc_table_1",
						columnName: "json",
						dataType: "json",
						defaultValue: null,
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						characterMaximumLength: null,
						datetimePrecision: null,
						renameFrom: null,
						primaryKey: null,
						foreignKeyConstraint: null,
					},
					jsonb: {
						tableName: "misc_table_1",
						columnName: "jsonb",
						dataType: "jsonb",
						defaultValue: null,
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						characterMaximumLength: null,
						datetimePrecision: null,
						renameFrom: null,
						primaryKey: null,
						foreignKeyConstraint: null,
					},
					uuid: {
						tableName: "misc_table_1",
						columnName: "uuid",
						dataType: "uuid",
						defaultValue: null,
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						characterMaximumLength: null,
						datetimePrecision: null,
						renameFrom: null,
						primaryKey: null,
						foreignKeyConstraint: null,
					},
				},
			});
		});

		it<DbContext>("returns info on columns with character data types", async ({
			kysely,
			tableNames,
		}) => {
			tableNames.push("character_table_1");
			tableNames.push("character_table_2");
			await kysely.schema
				.createTable("character_table_1")
				.addColumn("char_1", "char")
				.addColumn("char_10", "char(10)", (col) => col.defaultTo("foo"))
				.execute();
			await kysely.schema
				.createTable("character_table_2")
				.addColumn("varchar", "varchar", (column) => column.defaultTo("foo"))
				.addColumn("varchar_300", "varchar(300)")
				.addColumn("text", "text")
				.execute();
			const results = await dbColumnInfo(kysely, "public", [
				"character_table_1",
				"character_table_2",
			]);
			if (results.status === ActionStatus.Error) {
				throw results.error;
			}
			expect(results.result).toStrictEqual({
				character_table_1: {
					char_1: {
						tableName: "character_table_1",
						columnName: "char_1",
						dataType: "char(1)",
						defaultValue: null,
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						characterMaximumLength: 1,
						datetimePrecision: null,
						renameFrom: null,
						primaryKey: null,
						foreignKeyConstraint: null,
					},
					char_10: {
						tableName: "character_table_1",
						columnName: "char_10",
						dataType: "char(10)",
						defaultValue: "foo",
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						characterMaximumLength: 10,
						datetimePrecision: null,
						renameFrom: null,
						primaryKey: null,
						foreignKeyConstraint: null,
					},
				},
				character_table_2: {
					text: {
						tableName: "character_table_2",
						columnName: "text",
						dataType: "text",
						defaultValue: null,
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						characterMaximumLength: null,
						datetimePrecision: null,
						renameFrom: null,
						primaryKey: null,
						foreignKeyConstraint: null,
					},
					varchar: {
						tableName: "character_table_2",
						columnName: "varchar",
						dataType: "varchar",
						defaultValue: "foo",
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						characterMaximumLength: null,
						datetimePrecision: null,
						renameFrom: null,
						primaryKey: null,
						foreignKeyConstraint: null,
					},
					varchar_300: {
						tableName: "character_table_2",
						columnName: "varchar_300",
						dataType: "varchar(300)",
						defaultValue: null,
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						characterMaximumLength: 300,
						datetimePrecision: null,
						renameFrom: null,
						primaryKey: null,
						foreignKeyConstraint: null,
					},
				},
			});
		});

		it<DbContext>("returns info on columns with date/time data types", async ({
			kysely,
			tableNames,
		}) => {
			tableNames.push("dt_table_1");
			tableNames.push("dt_table_2");
			await kysely.schema
				.createTable("dt_table_1")
				.addColumn("timestamp", "timestamp")
				.addColumn("timestamp_p", "timestamp(3)")
				.addColumn("timestamptz", "timestamptz")
				.addColumn("timestamptz_p", "timestamptz(3)")
				.execute();
			await kysely.schema
				.createTable("dt_table_2")
				.addColumn("time", "time", (col) => col.defaultTo("12:00:00"))
				.addColumn("time_p", "time(3)")
				.addColumn("timetz", "timetz")
				.addColumn("timetz_p", "timetz(3)")
				.execute();
			const results = await dbColumnInfo(kysely, "public", [
				"dt_table_1",
				"dt_table_2",
			]);
			if (results.status === ActionStatus.Error) {
				throw results.error;
			}
			expect(results.result).toStrictEqual({
				dt_table_1: {
					timestamp: {
						tableName: "dt_table_1",
						columnName: "timestamp",
						dataType: "timestamp(6)",
						defaultValue: null,
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						characterMaximumLength: null,
						datetimePrecision: 6,
						renameFrom: null,
						primaryKey: null,
						foreignKeyConstraint: null,
					},
					timestamp_p: {
						tableName: "dt_table_1",
						columnName: "timestamp_p",
						dataType: "timestamp(3)",
						defaultValue: null,
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						characterMaximumLength: null,
						datetimePrecision: 3,
						renameFrom: null,
						primaryKey: null,
						foreignKeyConstraint: null,
					},
					timestamptz: {
						tableName: "dt_table_1",
						columnName: "timestamptz",
						dataType: "timestamptz(6)",
						defaultValue: null,
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						characterMaximumLength: null,
						datetimePrecision: 6,
						renameFrom: null,
						primaryKey: null,
						foreignKeyConstraint: null,
					},
					timestamptz_p: {
						tableName: "dt_table_1",
						columnName: "timestamptz_p",
						dataType: "timestamptz(3)",
						defaultValue: null,
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						characterMaximumLength: null,
						datetimePrecision: 3,
						renameFrom: null,
						primaryKey: null,
						foreignKeyConstraint: null,
					},
				},
				dt_table_2: {
					time: {
						tableName: "dt_table_2",
						columnName: "time",
						dataType: "time(6)",
						defaultValue: "12:00:00",
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						characterMaximumLength: null,
						datetimePrecision: 6,
						renameFrom: null,
						primaryKey: null,
						foreignKeyConstraint: null,
					},
					time_p: {
						tableName: "dt_table_2",
						columnName: "time_p",
						dataType: "time(3)",
						defaultValue: null,
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						characterMaximumLength: null,
						datetimePrecision: 3,
						renameFrom: null,
						primaryKey: null,
						foreignKeyConstraint: null,
					},
					timetz: {
						tableName: "dt_table_2",
						columnName: "timetz",
						dataType: "timetz(6)",
						defaultValue: null,
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						characterMaximumLength: null,
						datetimePrecision: 6,
						renameFrom: null,
						primaryKey: null,
						foreignKeyConstraint: null,
					},
					timetz_p: {
						tableName: "dt_table_2",
						columnName: "timetz_p",
						dataType: "timetz(3)",
						defaultValue: null,
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						characterMaximumLength: null,
						datetimePrecision: 3,
						renameFrom: null,
						primaryKey: null,
						foreignKeyConstraint: null,
					},
				},
			});
		});

		it<DbContext>("returns info with foreign key constraints", async ({
			kysely,
			tableNames,
		}) => {
			tableNames.push("fk_table_2");
			tableNames.push("fk_table_1");
			await kysely.schema
				.createTable("fk_table_1")
				.addColumn("id", "serial", (col) => col.primaryKey())
				.addColumn("price", "numeric(6, 3)")
				.execute();
			await kysely.schema
				.createTable("fk_table_2")
				.addColumn("name", "varchar", (col) => col.primaryKey())
				.addColumn("email", "char(255)")
				.addColumn("book_id", "integer")
				.addForeignKeyConstraint(
					"foreign_pk_books_id",
					["book_id"],
					"fk_table_1",
					["id"],
				)
				.execute();
			const table_1_results = await dbColumnInfo(kysely, "public", [
				"fk_table_1",
				"fk_table_2",
			]);
			if (table_1_results.status === ActionStatus.Error) {
				throw table_1_results.error;
			}
			expect(table_1_results.result).toStrictEqual({
				fk_table_1: {
					id: {
						characterMaximumLength: null,
						columnName: "id",
						dataType: "serial",
						datetimePrecision: null,
						defaultValue: null,
						foreignKeyConstraint: null,
						isNullable: false,
						numericPrecision: null,
						numericScale: null,
						primaryKey: true,
						renameFrom: null,
						tableName: "fk_table_1",
					},
					price: {
						characterMaximumLength: null,
						columnName: "price",
						dataType: "numeric(6, 3)",
						datetimePrecision: null,
						defaultValue: null,
						foreignKeyConstraint: null,
						isNullable: true,
						numericPrecision: 6,
						numericScale: 3,
						primaryKey: null,
						renameFrom: null,
						tableName: "fk_table_1",
					},
				},
				fk_table_2: {
					book_id: {
						characterMaximumLength: null,
						columnName: "book_id",
						dataType: "integer",
						datetimePrecision: null,
						defaultValue: null,
						foreignKeyConstraint: {
							table: "fk_table_1",
							column: "id",
						},
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						primaryKey: null,
						renameFrom: null,
						tableName: "fk_table_2",
					},
					email: {
						characterMaximumLength: 255,
						columnName: "email",
						dataType: "char(255)",
						datetimePrecision: null,
						defaultValue: null,
						foreignKeyConstraint: null,
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						primaryKey: null,
						renameFrom: null,
						tableName: "fk_table_2",
					},
					name: {
						characterMaximumLength: null,
						columnName: "name",
						dataType: "varchar",
						datetimePrecision: null,
						defaultValue: null,
						foreignKeyConstraint: null,
						isNullable: false,
						numericPrecision: null,
						numericScale: null,
						primaryKey: true,
						renameFrom: null,
						tableName: "fk_table_2",
					},
				},
			});
		});
	});

	// describe("#dbIndexInfo", () => {
	// 	it<DbContext>("returns info on table indexes", async ({
	// 		kysely,
	// 		tableNames,
	// 	}) => {
	// 		tableNames.push("test_indexes_1");
	// 		tableNames.push("test_indexes_2");

	// 		await kysely.schema
	// 			.createTable("test_indexes_1")
	// 			.addColumn("id", "serial")
	// 			.addColumn("name", "text")
	// 			.execute();

	// 		await kysely.schema
	// 			.createIndex("test_indexes_1_index_on_id")
	// 			.on("test_indexes_1")
	// 			.column("id")
	// 			.execute();

	// 		await kysely.schema
	// 			.createIndex("test_indexes_1_index_on_name")
	// 			.on("test_indexes_1")
	// 			.column("name")
	// 			.nullsNotDistinct()
	// 			.execute();

	// 		await kysely.schema
	// 			.createIndex("test_indexes_1_index_on_id_and_name")
	// 			.on("test_indexes_1")
	// 			.columns(["id", "name"])
	// 			.unique()
	// 			.ifNotExists()
	// 			.execute();

	// 		await kysely.schema
	// 			.createTable("test_indexes_2")
	// 			.addColumn("id", "serial")
	// 			.addColumn("email", "text")
	// 			.execute();

	// 		await kysely.schema
	// 			.createIndex("test_indexes_2_index_on_id")
	// 			.on("test_indexes_2")
	// 			.column("id")
	// 			.execute();

	// 		await kysely.schema
	// 			.createIndex("test_indexes_2_index_on_email")
	// 			.on("test_indexes_2")
	// 			.column("email")
	// 			.execute();

	// 		await kysely.schema
	// 			.createIndex("test_indexes_2_index_on_id_and_email")
	// 			.on("test_indexes_2")
	// 			.columns(["id", "email"])
	// 			.unique()
	// 			.ifNotExists()
	// 			.execute();

	// 		const results = await dbIndexInfo(kysely, "public", [
	// 			"test_indexes_1",
	// 			"test_indexes_2",
	// 		]);
	// 		expect(results).toStrictEqual({
	// 			result: {
	// 				test_indexes_1: {
	// 					test_indexes_1_index_on_id:
	// 						"CREATE INDEX test_indexes_1_index_on_id ON public.test_indexes_1 USING btree (id)",
	// 					test_indexes_1_index_on_name:
	// 						"CREATE INDEX test_indexes_1_index_on_name ON public.test_indexes_1 USING btree (name) NULLS NOT DISTINCT",
	// 					test_indexes_1_index_on_id_and_name:
	// 						"CREATE UNIQUE INDEX test_indexes_1_index_on_id_and_name ON public.test_indexes_1 USING btree (id, name)",
	// 				},
	// 				test_indexes_2: {
	// 					test_indexes_2_index_on_id:
	// 						"CREATE INDEX test_indexes_2_index_on_id ON public.test_indexes_2 USING btree (id)",
	// 					test_indexes_2_index_on_email:
	// 						"CREATE INDEX test_indexes_2_index_on_email ON public.test_indexes_2 USING btree (email)",
	// 					test_indexes_2_index_on_id_and_email:
	// 						"CREATE UNIQUE INDEX test_indexes_2_index_on_id_and_email ON public.test_indexes_2 USING btree (id, email)",
	// 				},
	// 			},
	// 			status: "Success",
	// 		});
	// 	});
	// });
});
