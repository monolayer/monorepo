import { afterEach, beforeEach, describe, expect, test } from "vitest";
import {
	alignColumns,
	introspectAlignment,
} from "~/actions/database/alignment.js";
import { type ColumnInfoFactoryOptions } from "./__setup__/helpers/factories/column-info-factory.js";
import { runProgramWithErrorCause } from "./__setup__/helpers/run-program.js";
import {
	setupProgramContext,
	teardownProgramContext,
	type ProgramContext,
} from "./__setup__/helpers/test-context.js";

describe("column aligner", () => {
	beforeEach<ProgramContext>(async (context) => {
		await setupProgramContext(context);
	});

	afterEach<ProgramContext>(async (context) => {
		await teardownProgramContext(context);
	});

	test("orders by typlen desc, non nullable", async () => {
		const columns = [
			column({ columnName: "bigSerial", dataType: "bigserial" }),
			column({ columnName: "bigInt", dataType: "bigint" }),
			column({ columnName: "varbit", dataType: "bit varying" }),
			column({ columnName: "bytea", dataType: "bytea" }),
			column({ columnName: "boolean", dataType: "boolean" }),
			column({ columnName: "date", dataType: "date" }),
			column({
				columnName: "doublePrecision",
				dataType: "double precision",
				isNullable: false,
			}),
			column({ columnName: "integer", dataType: "integer" }),
			column({ columnName: "char", dataType: "char" }),
			column({ columnName: "bit", dataType: "bit" }),
			column({ columnName: "smallint", dataType: "smallint" }),
			column({ columnName: "inet", dataType: "inet" }),
			column({ columnName: "macaddr", dataType: "macaddr" }),
			column({ columnName: "macaddr8", dataType: "macaddr8" }),
			column({ columnName: "json", dataType: "json" }),
			column({ columnName: "jsonB", dataType: "jsonb", isNullable: false }),
			column({ columnName: "numeric", dataType: "numeric" }),
			column({ columnName: "real", dataType: "real", isNullable: false }),
			column({ columnName: "serial", dataType: "serial", isNullable: false }),
			column({ columnName: "time2", dataType: "time without time zone" }),
			column({ columnName: "text", dataType: "text" }),
			column({ columnName: "time", dataType: "time" }),
			column({
				columnName: "timeWithTimeZone2",
				dataType: "time with time zone",
			}),
			column({ columnName: "timeWithTimeZone1", dataType: "timetz" }),
			column({
				columnName: "timestamp2",
				dataType: "timestamp without time zone",
			}),
			column({ columnName: "timestamp", dataType: "timestamp" }),
			column({
				columnName: "timestampWithTimeZone2",
				dataType: "timestamp with time zone",
			}),
			column({ columnName: "timestampWithTimeZone1", dataType: "timestamptz" }),
			column({
				columnName: "missingNotNullable",
				dataType: "notKnown",
				isNullable: false,
			}),
			column({ columnName: "userStatus", dataType: "status", enum: true }),
			column({ columnName: "zmissing", dataType: "notKnown" }),
			column({ columnName: "missing", dataType: "notKnown" }),
			column({ columnName: "amissing", dataType: "notKnown" }),
			column({ columnName: "uuid", dataType: "uuid" }),
			column({ columnName: "varChar", dataType: "varchar" }),
			column({ columnName: "varCharWithDefault", dataType: "varchar" }),
			column({ columnName: "vectorWithDefault", dataType: "tsvector" }),
			column({ columnName: "vector", dataType: "tsvector" }),
			column({ columnName: "tsqueryWithDefault", dataType: "tsquery" }),
			column({ columnName: "tsquery", dataType: "tsquery" }),
			column({ columnName: "tstzrange", dataType: "tstzrange" }),
			column({ columnName: "tsvector", dataType: "tsvector" }),
			column({
				columnName: "tsvector2",
				dataType: "tsvector",
				isNullable: false,
			}),
			column({ columnName: "xml", dataType: "xml", isNullable: false }),
		];

		const typeAlignments = await runProgramWithErrorCause(introspectAlignment);
		const aligned = alignColumns(columns, typeAlignments);
		const alignedNames = aligned.map((column) => column.columnName);

		const expected = [
			"doublePrecision",
			"bigInt",
			"bigSerial",
			"time",
			"time2",
			"timestamp",
			"timestamp2",
			"timestampWithTimeZone1",
			"timestampWithTimeZone2",
			"timeWithTimeZone1",
			"timeWithTimeZone2",
			"real",
			"serial",
			"date",
			"integer",
			"macaddr",
			"macaddr8",
			"userStatus",
			"smallint",
			"boolean",
			"char",
			"uuid",
			"tstzrange",
			"jsonB",
			"tsvector2",
			"xml",
			"bit",
			"bytea",
			"inet",
			"json",
			"numeric",
			"text",
			"tsquery",
			"tsqueryWithDefault",
			"tsvector",
			"varbit",
			"varChar",
			"varCharWithDefault",
			"vector",
			"vectorWithDefault",
			"missingNotNullable",
			"amissing",
			"missing",
			"zmissing",
		];
		expect(alignedNames).toEqual(expected);
	});
});

export function column(
	options: ColumnInfoFactoryOptions & { primaryKey?: boolean },
) {
	return {
		columnName: options.columnName,
		dataType: options.dataType,
		defaultValue:
			options.defaultValue !== undefined ? options.defaultValue : null,
		isNullable: options.isNullable ?? true,
		numericPrecision: options.numericPrecision ?? null,
		numericScale: options.numericScale ?? null,
		datetimePrecision: options.datetimePrecision ?? null,
		characterMaximumLength: options.characterMaximumLength ?? null,
		identity: options.identity ?? null,
		enum: options.enum ?? false,
		volatileDefault: options.volatileDefault ?? "unknown",
		primaryKey: options.primaryKey ?? false,
	};
}
