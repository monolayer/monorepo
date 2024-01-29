import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { dbColumnInfo, dbTableInfo } from "~/database/change_set/db_info.js";
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
			const hasTableInfo1 = results.some(
				(element) =>
					element.name === "table_info1" && element.schemaName === "public",
			);
			expect(hasTableInfo1).toBe(true);
			const hasTableInfo2 = results.some(
				(element) =>
					element.name === "table_info2" && element.schemaName === "public",
			);
			expect(hasTableInfo2).toBe(true);
			const hasTableInfo3 = results.some(
				(element) =>
					element.name === "table_info3" && element.schemaName === "public",
			);
			expect(hasTableInfo3).toBe(true);
		});
	});

	describe("#dbColumnInfo", () => {
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
			expect(table_1_results).toStrictEqual({
				numeric_table_1: {
					decimal: {
						tableName: "numeric_table_1",
						columnName: "decimal",
						dataType: "numeric",
						default: null,
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						characterMaximumLength: null,
						datetimePrecision: null,
						renameFrom: null,
					},
					numeric: {
						tableName: "numeric_table_1",
						columnName: "numeric",
						dataType: "numeric",
						default: null,
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						characterMaximumLength: null,
						datetimePrecision: null,
						renameFrom: null,
					},
				},
			});
			const table_2_results = await dbColumnInfo(kysely, "public", [
				"numeric_table_2",
			]);
			expect(table_2_results).toStrictEqual({
				numeric_table_2: {
					decimal_with_precision: {
						tableName: "numeric_table_2",
						columnName: "decimal_with_precision",
						dataType: "numeric(6, 0)",
						default: "12.3",
						isNullable: true,
						numericPrecision: 6,
						numericScale: 0,
						characterMaximumLength: null,
						datetimePrecision: null,
						renameFrom: null,
					},
					decimal_with_precision_and_scale: {
						tableName: "numeric_table_2",
						columnName: "decimal_with_precision_and_scale",
						dataType: "numeric(6, 2)",
						default: null,
						isNullable: true,
						numericPrecision: 6,
						numericScale: 2,
						characterMaximumLength: null,
						datetimePrecision: null,
						renameFrom: null,
					},
					numeric_with_precision: {
						tableName: "numeric_table_2",
						columnName: "numeric_with_precision",
						dataType: "numeric(6, 0)",
						default: null,
						isNullable: true,
						numericPrecision: 6,
						numericScale: 0,
						characterMaximumLength: null,
						datetimePrecision: null,
						renameFrom: null,
					},
					numeric_with_precision_and_scale: {
						tableName: "numeric_table_2",
						columnName: "numeric_with_precision_and_scale",
						dataType: "numeric(6, 2)",
						default: null,
						isNullable: true,
						numericPrecision: 6,
						numericScale: 2,
						characterMaximumLength: null,
						datetimePrecision: null,
						renameFrom: null,
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
			expect(results).toStrictEqual({
				integer_table_1: {
					bigint: {
						tableName: "integer_table_1",
						columnName: "bigint",
						dataType: "bigint",
						default: null,
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						characterMaximumLength: null,
						datetimePrecision: null,
						renameFrom: null,
					},
					int2: {
						tableName: "integer_table_1",
						columnName: "int2",
						dataType: "int2",
						default: null,
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						characterMaximumLength: null,
						datetimePrecision: null,
						renameFrom: null,
					},
					int4: {
						tableName: "integer_table_1",
						columnName: "int4",
						dataType: "integer",
						default: null,
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						characterMaximumLength: null,
						datetimePrecision: null,
						renameFrom: null,
					},
					int8: {
						tableName: "integer_table_1",
						columnName: "int8",
						dataType: "bigint",
						default: null,
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						characterMaximumLength: null,
						datetimePrecision: null,
						renameFrom: null,
					},
					integer: {
						tableName: "integer_table_1",
						columnName: "integer",
						dataType: "integer",
						default: null,
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						characterMaximumLength: null,
						datetimePrecision: null,
						renameFrom: null,
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
			expect(results).toStrictEqual({
				float_table_1: {
					double_precision: {
						tableName: "float_table_1",
						columnName: "double_precision",
						dataType: "double precision",
						default: null,
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						characterMaximumLength: null,
						datetimePrecision: null,
						renameFrom: null,
					},
					float4: {
						tableName: "float_table_1",
						columnName: "float4",
						dataType: "real",
						default: null,
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						characterMaximumLength: null,
						datetimePrecision: null,
						renameFrom: null,
					},
					float8: {
						tableName: "float_table_1",
						columnName: "float8",
						dataType: "double precision",
						default: null,
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						characterMaximumLength: null,
						datetimePrecision: null,
						renameFrom: null,
					},
					real: {
						tableName: "float_table_1",
						columnName: "real",
						dataType: "real",
						default: null,
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						characterMaximumLength: null,
						datetimePrecision: null,
						renameFrom: null,
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
			expect(results).toStrictEqual({
				serial_table_1: {
					bigserial: {
						tableName: "serial_table_1",
						columnName: "bigserial",
						dataType: "bigint",
						default: null,
						isNullable: false,
						numericPrecision: null,
						numericScale: null,
						characterMaximumLength: null,
						datetimePrecision: null,
						renameFrom: null,
					},
					serial: {
						tableName: "serial_table_1",
						columnName: "serial",
						dataType: "integer",
						default: null,
						isNullable: false,
						numericPrecision: null,
						numericScale: null,
						characterMaximumLength: null,
						datetimePrecision: null,
						renameFrom: null,
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
			expect(results).toStrictEqual({
				misc_table_1: {
					boolean: {
						tableName: "misc_table_1",
						columnName: "boolean",
						dataType: "boolean",
						default: null,
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						characterMaximumLength: null,
						datetimePrecision: null,
						renameFrom: null,
					},
					bytea: {
						tableName: "misc_table_1",
						columnName: "bytea",
						dataType: "bytea",
						default: null,
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						characterMaximumLength: null,
						datetimePrecision: null,
						renameFrom: null,
					},
					date: {
						tableName: "misc_table_1",
						columnName: "date",
						dataType: "date",
						default: null,
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						characterMaximumLength: null,
						datetimePrecision: null,
						renameFrom: null,
					},
					json: {
						tableName: "misc_table_1",
						columnName: "json",
						dataType: "json",
						default: null,
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						characterMaximumLength: null,
						datetimePrecision: null,
						renameFrom: null,
					},
					jsonb: {
						tableName: "misc_table_1",
						columnName: "jsonb",
						dataType: "jsonb",
						default: null,
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						characterMaximumLength: null,
						datetimePrecision: null,
						renameFrom: null,
					},
					uuid: {
						tableName: "misc_table_1",
						columnName: "uuid",
						dataType: "uuid",
						default: null,
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						characterMaximumLength: null,
						datetimePrecision: null,
						renameFrom: null,
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
			expect(results).toStrictEqual({
				character_table_1: {
					char_1: {
						tableName: "character_table_1",
						columnName: "char_1",
						dataType: "char(1)",
						default: null,
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						characterMaximumLength: 1,
						datetimePrecision: null,
						renameFrom: null,
					},
					char_10: {
						tableName: "character_table_1",
						columnName: "char_10",
						dataType: "char(10)",
						default: "foo",
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						characterMaximumLength: 10,
						datetimePrecision: null,
						renameFrom: null,
					},
				},
				character_table_2: {
					text: {
						tableName: "character_table_2",
						columnName: "text",
						dataType: "text",
						default: null,
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						characterMaximumLength: null,
						datetimePrecision: null,
						renameFrom: null,
					},
					varchar: {
						tableName: "character_table_2",
						columnName: "varchar",
						dataType: "varchar",
						default: "foo",
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						characterMaximumLength: null,
						datetimePrecision: null,
						renameFrom: null,
					},
					varchar_300: {
						tableName: "character_table_2",
						columnName: "varchar_300",
						dataType: "varchar(300)",
						default: null,
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						characterMaximumLength: 300,
						datetimePrecision: null,
						renameFrom: null,
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
			expect(results).toStrictEqual({
				dt_table_1: {
					timestamp: {
						tableName: "dt_table_1",
						columnName: "timestamp",
						dataType: "timestamp(6)",
						default: null,
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						characterMaximumLength: null,
						datetimePrecision: 6,
						renameFrom: null,
					},
					timestamp_p: {
						tableName: "dt_table_1",
						columnName: "timestamp_p",
						dataType: "timestamp(3)",
						default: null,
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						characterMaximumLength: null,
						datetimePrecision: 3,
						renameFrom: null,
					},
					timestamptz: {
						tableName: "dt_table_1",
						columnName: "timestamptz",
						dataType: "timestamptz(6)",
						default: null,
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						characterMaximumLength: null,
						datetimePrecision: 6,
						renameFrom: null,
					},
					timestamptz_p: {
						tableName: "dt_table_1",
						columnName: "timestamptz_p",
						dataType: "timestamptz(3)",
						default: null,
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						characterMaximumLength: null,
						datetimePrecision: 3,
						renameFrom: null,
					},
				},
				dt_table_2: {
					time: {
						tableName: "dt_table_2",
						columnName: "time",
						dataType: "time(6)",
						default: "12:00:00",
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						characterMaximumLength: null,
						datetimePrecision: 6,
						renameFrom: null,
					},
					time_p: {
						tableName: "dt_table_2",
						columnName: "time_p",
						dataType: "time(3)",
						default: null,
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						characterMaximumLength: null,
						datetimePrecision: 3,
						renameFrom: null,
					},
					timetz: {
						tableName: "dt_table_2",
						columnName: "timetz",
						dataType: "timetz(6)",
						default: null,
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						characterMaximumLength: null,
						datetimePrecision: 6,
						renameFrom: null,
					},
					timetz_p: {
						tableName: "dt_table_2",
						columnName: "timetz_p",
						dataType: "timetz(3)",
						default: null,
						isNullable: true,
						numericPrecision: null,
						numericScale: null,
						characterMaximumLength: null,
						datetimePrecision: 3,
						renameFrom: null,
					},
				},
			});
		});
	});
});
