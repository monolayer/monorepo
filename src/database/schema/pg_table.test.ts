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
import { pgTable } from "~/database/schema/pg_table.js";
import { pgForeignKeyConstraint } from "./pg_foreign_key.js";
import { pgPrimaryKeyConstraint } from "./pg_primary_key.js";
import { pgUniqueConstraint } from "./pg_unique.js";

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

	test("infer column types", () => {
		const table = pgTable("users", {
			columns: {
				pk: pgInteger().primaryKey(),
				id: pgSerial(),
				name: pgVarChar().notNull(),
				subscribed: pgBoolean(),
				email: pgText().notNull(),
				subscribers: pgInt4(),
			},
		});
		type ExpectedType = {
			pk: (typeof table.columns.pk)["_columnType"];
			id: (typeof table.columns.id)["_columnType"];
			name: (typeof table.columns.name)["_columnType"];
			email: (typeof table.columns.email)["_columnType"];
			subscribed: (typeof table.columns.subscribed)["_columnType"];
			subscribers: (typeof table.columns.subscribers)["_columnType"];
		};
		type InferredType = typeof table.infer;
		const expect: Expect<Equal<InferredType, ExpectedType>> = true;
		expectTypeOf(expect).toMatchTypeOf<boolean>();
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

	test("indexes are empty by default", () => {
		const columns = {
			name: pgVarChar(),
			subscribed: pgBoolean(),
		};
		const table = pgTable("users", {
			columns: columns,
		});
		expect(table.indexes).toStrictEqual([]);
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

	describe("constraints", () => {
		test("constraints are empty by default", () => {
			const columns = {
				name: pgVarChar(),
				subscribed: pgBoolean(),
			};
			const table = pgTable("users", {
				columns: columns,
			});
			expect(table.constraints).toStrictEqual([]);
		});

		test("foreign key constraints can be added", () => {
			const columns = {
				id: pgSerial().primaryKey(),
				name: pgVarChar(),
				subscribed: pgBoolean(),
			};
			const foreignKeyConstraint1 = pgForeignKeyConstraint(
				["user_id"],
				"users",
				["id"],
			);
			const foreignKeyConstraint2 = pgForeignKeyConstraint(
				["book_id"],
				"books",
				["id"],
			);

			const table = pgTable("users", {
				columns: columns,
				constraints: [foreignKeyConstraint1, foreignKeyConstraint2],
			});
			expect(table.constraints).toStrictEqual([
				foreignKeyConstraint1,
				foreignKeyConstraint2,
			]);
		});

		test("unique constraints can be added", () => {
			const columns = {
				id: pgSerial().primaryKey(),
				name: pgVarChar(),
				subscribed: pgBoolean(),
			};
			const uniqueConstraint1 = pgUniqueConstraint(["name"]);
			const uniqueConstraint2 = pgUniqueConstraint(["subscribed"]);

			const table = pgTable("users", {
				columns: columns,
				constraints: [uniqueConstraint1, uniqueConstraint2],
			});
			expect(table.constraints).toStrictEqual([
				uniqueConstraint1,
				uniqueConstraint2,
			]);
		});

		test("primary key constraints can be added the table level", () => {
			const columns = {
				id: pgInteger(),
				name: pgVarChar(),
			};
			const primaryKey = pgPrimaryKeyConstraint(["id", "name"]);
			const table = pgTable("users", {
				columns: columns,
				constraints: [primaryKey],
			});
			expect(table.constraints).toStrictEqual([primaryKey]);
		});
	});
});
