import { Equal, Expect } from "type-testing";
import { describe, expect, expectTypeOf, test } from "vitest";
import {
	pgBigSerial,
	pgBoolean,
	pgInt4,
	pgText,
	pgVarchar,
} from "~/database/schema/columns.js";
import { pgTable } from "~/database/schema/table.js";

describe("pgTable definition", () => {
	test("has a name", () => {
		const table = pgTable("users", {
			columns: {
				name: pgVarchar(),
				subscribed: pgBoolean(),
			},
		});
		expect(table.name).toBe("users");
	});
	test("has columns defined", () => {
		const columns = {
			name: pgVarchar(),
			subscribed: pgBoolean(),
		};
		const table = pgTable("users", {
			columns: columns,
		});
		expect(table.columns).toBe(columns);
	});

	test("inferSelect column types", () => {
		const columns = {
			name: pgVarchar().nonNullable(),
			subscribed: pgBoolean(),
			email: pgText().nonNullable().nullable(),
			subscribers: pgInt4(),
		};
		const table = pgTable("users", {
			columns: columns,
		});
		type ExpectedType = {
			name: string;
			subscribed?: boolean;
			email?: string;
			subscribers?: number;
		};
		type SelectType = typeof table.inferSelect;
		const expect: Expect<Equal<SelectType, ExpectedType>> = true;
		expectTypeOf(expect).toMatchTypeOf<boolean>();
	});

	test("inferInsert column types", () => {
		const columns = {
			id: pgBigSerial().nonNullable(),
			name: pgVarchar().nonNullable(),
			email: pgText().nonNullable().nullable(),
			subscribers: pgInt4(),
		};
		const table = pgTable("users", {
			columns: columns,
		});
		type ExpectedType = {
			id: string | number | bigint;
			name: string;
			email?: string;
			subscribers?: string | number;
		};
		type InsertType = typeof table.inferInsert;
		const expect: Expect<Equal<InsertType, ExpectedType>> = true;
		expectTypeOf(expect).toMatchTypeOf<boolean>();
	});
});
