import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ActionStatus } from "~/cli/command.js";
import {
	dbColumnInfo,
	dbTableInfo,
} from "~/database/introspection/database.js";
import { columnInfoFactory } from "~tests/helpers/factories/column_info_factory.js";
import { DbContext, globalKysely } from "~tests/setup.js";
import { ColumnIdentity, ColumnUnique } from "../schema/pg_column.js";

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
					decimal: columnInfoFactory({
						tableName: "numeric_table_1",
						columnName: "decimal",
						dataType: "numeric",
						isNullable: true,
					}),
					numeric: columnInfoFactory({
						tableName: "numeric_table_1",
						columnName: "numeric",
						dataType: "numeric",
						isNullable: true,
					}),
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
					decimal_with_precision: columnInfoFactory({
						tableName: "numeric_table_2",
						columnName: "decimal_with_precision",
						dataType: "numeric(6, 0)",
						defaultValue: "12.3",
						isNullable: true,
						numericPrecision: 6,
						numericScale: 0,
					}),
					decimal_with_precision_and_scale: columnInfoFactory({
						tableName: "numeric_table_2",
						columnName: "decimal_with_precision_and_scale",
						dataType: "numeric(6, 2)",
						isNullable: true,
						numericPrecision: 6,
						numericScale: 2,
					}),
					numeric_with_precision: columnInfoFactory({
						tableName: "numeric_table_2",
						columnName: "numeric_with_precision",
						dataType: "numeric(6, 0)",
						isNullable: true,
						numericPrecision: 6,
						numericScale: 0,
					}),
					numeric_with_precision_and_scale: columnInfoFactory({
						tableName: "numeric_table_2",
						columnName: "numeric_with_precision_and_scale",
						dataType: "numeric(6, 2)",
						isNullable: true,
						numericPrecision: 6,
						numericScale: 2,
					}),
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
					bigint: columnInfoFactory({
						tableName: "integer_table_1",
						columnName: "bigint",
						dataType: "bigint",
						isNullable: true,
					}),
					int2: columnInfoFactory({
						tableName: "integer_table_1",
						columnName: "int2",
						dataType: "int2",
						isNullable: true,
					}),
					int4: columnInfoFactory({
						tableName: "integer_table_1",
						columnName: "int4",
						dataType: "integer",
						isNullable: true,
					}),
					int8: columnInfoFactory({
						tableName: "integer_table_1",
						columnName: "int8",
						dataType: "bigint",
						isNullable: true,
					}),
					integer: columnInfoFactory({
						tableName: "integer_table_1",
						columnName: "integer",
						dataType: "integer",
						isNullable: true,
					}),
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
					double_precision: columnInfoFactory({
						tableName: "float_table_1",
						columnName: "double_precision",
						dataType: "double precision",
						isNullable: true,
					}),
					float4: columnInfoFactory({
						tableName: "float_table_1",
						columnName: "float4",
						dataType: "real",
						isNullable: true,
					}),
					float8: columnInfoFactory({
						tableName: "float_table_1",
						columnName: "float8",
						dataType: "double precision",
						isNullable: true,
					}),
					real: columnInfoFactory({
						tableName: "float_table_1",
						columnName: "real",
						dataType: "real",
						isNullable: true,
					}),
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
					bigserial: columnInfoFactory({
						tableName: "serial_table_1",
						columnName: "bigserial",
						dataType: "bigserial",
						isNullable: false,
					}),
					serial: columnInfoFactory({
						tableName: "serial_table_1",
						columnName: "serial",
						dataType: "serial",
						isNullable: false,
					}),
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
					boolean: columnInfoFactory({
						tableName: "misc_table_1",
						columnName: "boolean",
						dataType: "boolean",
						isNullable: true,
					}),
					bytea: columnInfoFactory({
						tableName: "misc_table_1",
						columnName: "bytea",
						dataType: "bytea",
						isNullable: true,
					}),
					date: columnInfoFactory({
						tableName: "misc_table_1",
						columnName: "date",
						dataType: "date",
						isNullable: true,
					}),
					json: columnInfoFactory({
						tableName: "misc_table_1",
						columnName: "json",
						dataType: "json",
						isNullable: true,
					}),
					jsonb: columnInfoFactory({
						tableName: "misc_table_1",
						columnName: "jsonb",
						dataType: "jsonb",
						isNullable: true,
					}),
					uuid: columnInfoFactory({
						tableName: "misc_table_1",
						columnName: "uuid",
						dataType: "uuid",
						isNullable: true,
					}),
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
					char_1: columnInfoFactory({
						tableName: "character_table_1",
						columnName: "char_1",
						dataType: "char(1)",
						isNullable: true,
						characterMaximumLength: 1,
					}),
					char_10: columnInfoFactory({
						tableName: "character_table_1",
						columnName: "char_10",
						dataType: "char(10)",
						defaultValue: "foo",
						isNullable: true,
						characterMaximumLength: 10,
					}),
				},
				character_table_2: {
					text: columnInfoFactory({
						tableName: "character_table_2",
						columnName: "text",
						dataType: "text",
						isNullable: true,
					}),
					varchar: columnInfoFactory({
						tableName: "character_table_2",
						columnName: "varchar",
						dataType: "varchar",
						defaultValue: "foo",
						isNullable: true,
					}),
					varchar_300: columnInfoFactory({
						tableName: "character_table_2",
						columnName: "varchar_300",
						dataType: "varchar(300)",
						isNullable: true,
						characterMaximumLength: 300,
					}),
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
					timestamp: columnInfoFactory({
						tableName: "dt_table_1",
						columnName: "timestamp",
						dataType: "timestamp(6)",
						isNullable: true,
						datetimePrecision: 6,
					}),
					timestamp_p: columnInfoFactory({
						tableName: "dt_table_1",
						columnName: "timestamp_p",
						dataType: "timestamp(3)",
						isNullable: true,
						datetimePrecision: 3,
					}),
					timestamptz: columnInfoFactory({
						tableName: "dt_table_1",
						columnName: "timestamptz",
						dataType: "timestamptz(6)",
						isNullable: true,
						datetimePrecision: 6,
					}),
					timestamptz_p: columnInfoFactory({
						tableName: "dt_table_1",
						columnName: "timestamptz_p",
						dataType: "timestamptz(3)",
						isNullable: true,
						datetimePrecision: 3,
					}),
				},
				dt_table_2: {
					time: columnInfoFactory({
						tableName: "dt_table_2",
						columnName: "time",
						dataType: "time(6)",
						defaultValue: "12:00:00",
						isNullable: true,
						datetimePrecision: 6,
					}),
					time_p: columnInfoFactory({
						tableName: "dt_table_2",
						columnName: "time_p",
						dataType: "time(3)",
						isNullable: true,
						datetimePrecision: 3,
					}),
					timetz: columnInfoFactory({
						tableName: "dt_table_2",
						columnName: "timetz",
						dataType: "timetz(6)",
						isNullable: true,
						datetimePrecision: 6,
					}),
					timetz_p: columnInfoFactory({
						tableName: "dt_table_2",
						columnName: "timetz_p",
						dataType: "timetz(3)",
						isNullable: true,
						datetimePrecision: 3,
					}),
				},
			});
		});

		it<DbContext>("returns info with foreign key constraints", async ({
			kysely,
			tableNames,
		}) => {
			tableNames.push("fk_table_3");
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
					"foreign_fk_table_2_pk_books_id",
					["book_id"],
					"fk_table_1",
					["id"],
				)
				.execute();

			await kysely.schema
				.createTable("fk_table_3")
				.addColumn("book_id", "integer")
				.addForeignKeyConstraint(
					"foreign_fk_table_3_pk_books_id",
					["book_id"],
					"fk_table_1",
					["id"],
					(cb) => cb.onDelete("set null").onUpdate("cascade"),
				)
				.execute();

			const table_1_results = await dbColumnInfo(kysely, "public", [
				"fk_table_1",
				"fk_table_2",
				"fk_table_3",
			]);
			if (table_1_results.status === ActionStatus.Error) {
				throw table_1_results.error;
			}
			expect(table_1_results.result).toStrictEqual({
				fk_table_1: {
					id: columnInfoFactory({
						columnName: "id",
						dataType: "serial",
						isNullable: false,
						primaryKey: true,
						tableName: "fk_table_1",
					}),
					price: columnInfoFactory({
						columnName: "price",
						dataType: "numeric(6, 3)",
						isNullable: true,
						numericPrecision: 6,
						numericScale: 3,
						tableName: "fk_table_1",
					}),
				},
				fk_table_2: {
					book_id: columnInfoFactory({
						columnName: "book_id",
						dataType: "integer",
						foreignKeyConstraint: {
							table: "fk_table_1",
							column: "id",
							options: "no action;no action",
						},
						isNullable: true,
						tableName: "fk_table_2",
					}),
					email: columnInfoFactory({
						characterMaximumLength: 255,
						columnName: "email",
						dataType: "char(255)",
						isNullable: true,
						tableName: "fk_table_2",
					}),
					name: columnInfoFactory({
						columnName: "name",
						dataType: "varchar",
						isNullable: false,
						primaryKey: true,
						tableName: "fk_table_2",
					}),
				},
				fk_table_3: {
					book_id: columnInfoFactory({
						columnName: "book_id",
						dataType: "integer",
						foreignKeyConstraint: {
							table: "fk_table_1",
							column: "id",
							options: "set null;cascade",
						},
						isNullable: true,
						tableName: "fk_table_3",
					}),
				},
			});
		});

		it<DbContext>("returns info with identity", async ({
			kysely,
			tableNames,
		}) => {
			tableNames.push("identity_table_1");
			await kysely.schema
				.createTable("identity_table_1")
				.addColumn("id", "integer", (col) =>
					col.primaryKey().generatedByDefaultAsIdentity(),
				)
				.addColumn("price", "integer", (col) => col.generatedAlwaysAsIdentity())
				.execute();
			const table_1_results = await dbColumnInfo(kysely, "public", [
				"identity_table_1",
			]);
			if (table_1_results.status === ActionStatus.Error) {
				throw table_1_results.error;
			}
			expect(table_1_results.result).toStrictEqual({
				identity_table_1: {
					id: columnInfoFactory({
						columnName: "id",
						dataType: "integer",
						isNullable: false,
						primaryKey: true,
						tableName: "identity_table_1",
						identity: ColumnIdentity.ByDefault,
					}),
					price: columnInfoFactory({
						columnName: "price",
						dataType: "integer",
						isNullable: false,
						tableName: "identity_table_1",
						identity: ColumnIdentity.Always,
					}),
				},
			});
		});
		it<DbContext>("returns info with unique constraint", async ({
			kysely,
			tableNames,
		}) => {
			tableNames.push("unique_constraint_test");
			await kysely.schema
				.createTable("unique_constraint_test")
				.addColumn("price", "integer", (col) => col.unique())
				.addColumn("demo", "integer", (col) => col.unique().nullsNotDistinct())
				.execute();
			const table_1_results = await dbColumnInfo(kysely, "public", [
				"unique_constraint_test",
			]);
			if (table_1_results.status === ActionStatus.Error) {
				throw table_1_results.error;
			}
			expect(table_1_results.result).toStrictEqual({
				unique_constraint_test: {
					price: columnInfoFactory({
						columnName: "price",
						dataType: "integer",
						isNullable: true,
						tableName: "unique_constraint_test",
						unique: ColumnUnique.NullsDistinct,
					}),
					demo: columnInfoFactory({
						columnName: "demo",
						dataType: "integer",
						isNullable: true,
						tableName: "unique_constraint_test",
						unique: ColumnUnique.NullsNotDistinct,
					}),
				},
			});
		});
	});
});
