import { Equal, Expect } from "type-testing";
import { expect, test } from "vitest";
import z from "zod";
import { bigint } from "~pg/schema/column/data-types/bigint.js";
import { varchar } from "~pg/schema/column/data-types/character-varying.js";
import { integer } from "~pg/schema/column/data-types/integer.js";
import { text } from "~pg/schema/column/data-types/text.js";
import { timestamptz } from "~pg/schema/column/data-types/timestamp-with-time-zone.js";
import { primaryKey } from "~pg/schema/primary-key.js";
import { table } from "~pg/schema/table.js";
import { zodSchema } from "~pg/zod/zod_schema.js";

test("schema types match column constraints and defaults", () => {
	const tbl = table({
		columns: {
			id: bigint(),
			idPk: integer(),
			name: varchar().notNull(),
			createdAt: timestamptz().default("now()"),
		},
		constraints: {
			primaryKey: primaryKey(["idPk"]),
		},
	});

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const tableSchema = zodSchema(tbl);

	type InputSchema = z.input<typeof tableSchema>;
	type ExpectedInput = {
		idPk: string | number;
		name: string;
		id?: string | number | bigint | null | undefined;
		createdAt?: string | Date | null | undefined;
	};
	const isEqualInput: Expect<Equal<InputSchema, ExpectedInput>> = true;
	expect(isEqualInput).toBe(true);

	type OuputSchema = z.output<typeof tableSchema>;
	type ExpectedOutput = {
		idPk: number;
		name: string;
		id?: string | null | undefined;
		createdAt?: Date | null | undefined;
	};
	const isEqualOutput: Expect<Equal<OuputSchema, ExpectedOutput>> = true;
	expect(isEqualOutput).toBe(true);
});

test("schema parses successfully with undefined optionals", () => {
	const tbl = table({
		columns: {
			name: text(),
			description: text().default("TDB"),
		},
	});

	const tableSchema = zodSchema(tbl);
	expect(tableSchema.safeParse({}).success).toBe(true);
});

test("schema does not parse successfully with explicit undefined", () => {
	const tbl = table({
		columns: {
			name: text().notNull(),
			description: text().default("TDB"),
		},
	});

	const tableSchema = zodSchema(tbl);
	const result = tableSchema.safeParse({
		name: undefined,
		description: undefined,
	});
	expect(result.success).toBe(false);
	if (!result.success) {
		const expected = [
			{
				code: "invalid_type",
				expected: "string",
				message: "Required",
				path: ["name"],
				received: "undefined",
			},
			{
				code: "custom",
				path: ["description"],
				message: "Value cannot be undefined",
				fatal: true,
			},
		];
		expect(result.error.errors).toStrictEqual(expected);
	}
});

test("schema parse with defined constraints", () => {
	const tbl = table({
		columns: {
			id: integer().notNull(),
			name: text().notNull(),
		},
	});

	const tableSchema = zodSchema(tbl);
	const resultFail = tableSchema.safeParse({});
	expect(resultFail.success).toBe(false);
	if (!resultFail.success) {
		const formattedErrors = resultFail.error.format();
		expect(formattedErrors.id?._errors).toStrictEqual(["Required"]);
		expect(formattedErrors.name?._errors).toStrictEqual(["Required"]);
	}

	const result = tableSchema.safeParse({
		id: 1,
		name: "John",
	});

	expect(result.success).toBe(true);
	if (result.success) {
		expect(result.data.id).toBe(1);
		expect(result.data.name).toStrictEqual("John");
	}
});
