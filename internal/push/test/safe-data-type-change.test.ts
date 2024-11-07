import { describe, expect, test } from "vitest";
import { safeDataTypeChange } from "~push/changeset/safe-data-types-change.js";

describe("Safe data type change", () => {
	test("from character varying to text is safe", () => {
		expect(safeDataTypeChange("character varying", "text")).toBe(true);
	});

	test("from cidr to inet is safe", () => {
		expect(safeDataTypeChange("cidr", "inet")).toBe(true);
	});

	test("from timestamp to timestamp with timezone is safe", () => {
		expect(safeDataTypeChange("timestamp", "timestamp with time zone")).toBe(
			true,
		);
	});

	test("from timestamp with time zone to timestamp is safe", () => {
		expect(safeDataTypeChange("timestamp with time zone", "timestamp")).toBe(
			true,
		);
	});

	test("from character varying with increased limit is safe", () => {
		expect(
			safeDataTypeChange("character varying(10)", "character varying(20)"),
		).toBe(true);
	});

	test("from numeric with removed precision and scale is safe", () => {
		expect(safeDataTypeChange("numeric(10, 2)", "numeric")).toBe(true);
	});

	test("from numeric with increased precision and same scale is safe", () => {
		expect(safeDataTypeChange("numeric(10, 2)", "numeric(20, 2)")).toBe(true);
	});

	test("from time with removed precision is safe", () => {
		expect(safeDataTypeChange("time(2)", "time")).toBe(true);
	});

	test("from time with increased precision is safe", () => {
		expect(safeDataTypeChange("time(2)", "time(4)")).toBe(true);
	});

	test("from time with time zone with removed precision is safe", () => {
		expect(
			safeDataTypeChange("time(2) with time zone", "time with time zone"),
		).toBe(true);
	});

	test("from time with time zone with increased precision is safe", () => {
		expect(
			safeDataTypeChange("time(2) with time zone", "time(4) with time zone"),
		).toBe(true);
	});

	test("from timestamp with removed precision is safe", () => {
		expect(safeDataTypeChange("timestamp(2)", "timestamp")).toBe(true);
	});

	test("from timestamp with increased precision is safe", () => {
		expect(safeDataTypeChange("timestamp(2)", "timestamp(4)")).toBe(true);
	});

	test("from timestamp with time zone with removed precision is safe", () => {
		expect(
			safeDataTypeChange(
				"timestamp(2) with time zone",
				"timestamp with time zone",
			),
		).toBe(true);
	});

	test("from timestamp with time zonewith increased precision is safe", () => {
		expect(
			safeDataTypeChange(
				"timestamp(2) with time zone",
				"timestamp(4) with time zone",
			),
		).toBe(true);
	});

	test("from bit varying varying removing maximum length is safe", () => {
		expect(safeDataTypeChange("bit varying(10)", "bit varying")).toBe(true);
	});

	test("from bit varying with increased maximum length is safe", () => {
		expect(safeDataTypeChange("bit varying(10)", "bit varying(20)")).toBe(true);
	});

	test("unsafe data type change", () => {
		const dataTypes = [
			"bigint",
			"bigserial",
			"bit",
			"bit(10)",
			"bit varying",
			"bit varying(10)",
			"boolean",
			"bytea",
			"char",
			"char(10)",
			"cidr",
			"date",
			"double precision",
			"integer",
			"inet",
			"json",
			"jsonb",
			"macaddr",
			"macaddr8",
			"numeric",
			"numeric(10)",
			"numeric(10, 2)",
			"real",
			"serial",
			"smallint",
			"text",
			"time",
			"time with time zone",
			"timestamp",
			"timestamp with time zone",
			"tsvector",
			"tsquery",
			"uuid",
			"xml",
		];
		for (const oldType of dataTypes) {
			for (const newType of dataTypes) {
				if (oldType === newType) continue;
				if (oldType === "character varying" && newType === "text") continue;
				if (oldType === "cidr" && newType === "inet") continue;
				if (oldType === "timestamp" && newType === "timestamp with time zone")
					continue;
				if (oldType === "timestamp with time zone" && newType === "timestamp")
					continue;
				if (oldType.includes("numeric") && newType.includes("numeric"))
					continue;
				if (oldType.includes("bit varying") && newType.includes("bit varying"))
					continue;
				expect(safeDataTypeChange(oldType, newType)).toBe(false);
			}
		}
	});
});
