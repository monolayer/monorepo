import { Equal, Expect } from "type-testing";
import { describe, expect, expectTypeOf, test } from "vitest";
import {
	pgBoolean,
	pgInt4,
	pgInteger,
	pgSerial,
	pgText,
	pgVarChar,
} from "~/database/schema/pg_column.js";
import { pgIndex } from "~/database/schema/pg_index.js";
import { pgTable } from "~/database/schema/table.js";

describe("pgTable definition", () => {
	test("has a name", () => {
		const table = pgTable("users", {
			columns: {
				name: pgVarChar(),
				subscribed: pgBoolean(),
			},
		});
		expect(table.name).toBe("users");
	});

	test("has columns defined", () => {
		const columns = {
			name: pgVarChar(),
			subscribed: pgBoolean(),
		};
		const table = pgTable("users", {
			columns: columns,
		});
		expect(table.columns).toBe(columns);
	});

	test("inferSelect column types", () => {
		const columns = {
			pk: pgInteger().primaryKey(),
			id: pgSerial(),
			name: pgVarChar().notNull(),
			subscribed: pgBoolean(),
			email: pgText().notNull(),
			subscribers: pgInt4(),
		};
		const table = pgTable("users", {
			columns: columns,
		});
		type ExpectedType = {
			pk: number;
			id: number;
			name: string;
			email: string;
			subscribed: boolean | null;
			subscribers: number | null;
		};
		type InferredSelectType = typeof table.inferSelect;
		const expect: Expect<Equal<InferredSelectType, ExpectedType>> = true;
		expectTypeOf(expect).toMatchTypeOf<boolean>();
	});

	describe("inferInsert column types", () => {
		test("primary keys are required by default", () => {
			const columns = {
				pk: pgInteger().primaryKey(),
			};
			const table = pgTable("users", {
				columns: columns,
			});
			type ExpectedType = {
				pk: number | string;
			};
			type InferredInsertType = typeof table.inferInsert;
			const expect: Expect<Equal<InferredInsertType, ExpectedType>> = true;
			expectTypeOf(expect).toMatchTypeOf<boolean>();
		});

		test("primary keys are optional on generated columns", () => {
			const users = pgTable("users", {
				columns: {
					pk: pgSerial().primaryKey(),
				},
			});
			type ExpectedType = {
				pk?: number | string;
			};

			type InferredUsersInsertType = typeof users.inferInsert;
			const usersExpect: Expect<Equal<InferredUsersInsertType, ExpectedType>> =
				true;
			expectTypeOf(usersExpect).toMatchTypeOf<boolean>();

			const books = pgTable("users", {
				columns: {
					pk: pgSerial().primaryKey(),
				},
			});
			type InferredBooksInsertType = typeof books.inferInsert;
			const booksExpect: Expect<Equal<InferredBooksInsertType, ExpectedType>> =
				true;
			expectTypeOf(booksExpect).toMatchTypeOf<boolean>();
		});

		test("inferInsert column types", () => {
			const columns = {
				pk: pgInteger().primaryKey(),
				id: pgSerial(),
				name: pgVarChar().notNull(),
				subscribed: pgBoolean(),
				email: pgText().notNull(),
				subscribers: pgInt4(),
			};
			const table = pgTable("users", {
				columns: columns,
			});
			type ExpectedType = {
				pk: number | string;
				id?: number | string;
				name: string;
				email: string;
				subscribed?: boolean | null;
				subscribers?: number | string | null;
			};
			type InferredInsertType = typeof table.inferInsert;
			const expect: Expect<Equal<InferredInsertType, ExpectedType>> = true;
			expectTypeOf(expect).toMatchTypeOf<boolean>();
		});
	});

	test("inferUpdate column types", () => {
		const columns = {
			pk: pgInteger().primaryKey(),
			id: pgSerial(),
			name: pgVarChar().notNull(),
			subscribed: pgBoolean(),
			email: pgText().notNull(),
			subscribers: pgInt4(),
		};
		const table = pgTable("users", {
			columns: columns,
		});
		type ExpectedType = {
			pk?: number | string;
			id?: string | number;
			name?: string;
			email?: string;
			subscribed?: boolean | null;
			subscribers?: number | string | null;
		};
		type InferredUpdateType = typeof table.inferUpdate;
		const expect: Expect<Equal<InferredUpdateType, ExpectedType>> = true;
		expectTypeOf(expect).toMatchTypeOf<boolean>();
	});

	test("indexes are undefined by default", () => {
		const columns = {
			name: pgVarChar(),
			subscribed: pgBoolean(),
		};
		const table = pgTable("users", {
			columns: columns,
		});
		expect(table.indexes).toBeUndefined();
	});

	test("indexes can be added", () => {
		const indexes = [
			pgIndex("index_on_name", (idx) =>
				idx.ifNotExists().unique().using("btree"),
			),
			pgIndex("index_on_subscribe", (idx) =>
				idx.ifNotExists().unique().using("btree"),
			),
		];
		const columns = {
			name: pgVarChar(),
			subscribed: pgBoolean(),
		};
		const table = pgTable("users", {
			columns: columns,
			indexes,
		});
		expect(table.indexes).toStrictEqual(indexes);
	});
});
