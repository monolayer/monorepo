import { Equal, Expect } from "type-testing";
import { describe, expect, expectTypeOf, test } from "vitest";
import {
	boolean,
	int4,
	integer,
	pgEnum,
	serial,
	text,
	varchar,
} from "~/database/schema/pg_column.js";
import { PgIndex, index } from "~/database/schema/pg_index.js";
import { pgTable } from "~/database/schema/pg_table.js";
import { PgForeignKey, foreignKey } from "./pg_foreign_key.js";
import { PgPrimaryKey, primaryKey } from "./pg_primary_key.js";
import { PgUnique, unique } from "./pg_unique.js";

describe("pgTable definition", () => {
	test("has a name", () => {
		const tbl = pgTable("users", {
			columns: {
				name: varchar(),
				subscribed: boolean(),
			},
		});
		expect(tbl.name).toBe("users");
	});

	test("has columns defined", () => {
		const columns = {
			name: varchar(),
			subscribed: boolean(),
		};
		const tbl = pgTable("users", {
			columns: columns,
		});
		expect(tbl.columns).toBe(columns);
	});

	test("columns with pgEnum", () => {
		const columns = {
			name: varchar(),
			subscribed: boolean(),
			role: pgEnum("role", ["admin", "user"]),
		};
		const tbl = pgTable("users", {
			columns: columns,
		});
		expect(tbl.columns).toBe(columns);
	});

	test("infer column types", () => {
		const tbl = pgTable("users", {
			columns: {
				pk: integer(),
				id: serial(),
				name: varchar().notNull(),
				subscribed: boolean(),
				email: text().notNull(),
				subscribers: int4(),
			},
		});
		type ExpectedType = {
			pk: (typeof tbl.columns.pk)["_columnType"];
			id: (typeof tbl.columns.id)["_columnType"];
			name: (typeof tbl.columns.name)["_columnType"];
			email: (typeof tbl.columns.email)["_columnType"];
			subscribed: (typeof tbl.columns.subscribed)["_columnType"];
			subscribers: (typeof tbl.columns.subscribers)["_columnType"];
		};
		type InferredType = typeof tbl.infer;
		const expect: Expect<Equal<InferredType, ExpectedType>> = true;
		expectTypeOf(expect).toMatchTypeOf<boolean>();
	});

	test("inferSelect column types", () => {
		const columns = {
			pk: integer(),
			id: serial(),
			name: varchar().notNull(),
			subscribed: boolean(),
			email: text().notNull(),
			subscribers: int4(),
		};
		const tbl = pgTable("users", {
			columns: columns,
		});
		type ExpectedType = {
			pk: number | null;
			id: number;
			name: string;
			email: string;
			subscribed: boolean | null;
			subscribers: number | null;
		};
		type InferredSelectType = typeof tbl.inferSelect;
		const expect: Expect<Equal<InferredSelectType, ExpectedType>> = true;
		expectTypeOf(expect).toMatchTypeOf<boolean>();
	});

	describe("inferInsert column types", () => {
		test("primary keys are required by default", () => {
			const columns = {
				pk: integer(),
			};
			const tbl = pgTable("users", {
				columns: columns,
			});
			type ExpectedType = {
				pk?: number | string | null;
			};
			type InferredInsertType = typeof tbl.inferInsert;
			const expect: Expect<Equal<InferredInsertType, ExpectedType>> = true;
			expectTypeOf(expect).toMatchTypeOf<boolean>();
		});

		test("primary keys are optional on generated columns", () => {
			const users = pgTable("users", {
				columns: {
					pk: serial(),
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
					pk: serial(),
				},
			});
			type InferredBooksInsertType = typeof books.inferInsert;
			const booksExpect: Expect<Equal<InferredBooksInsertType, ExpectedType>> =
				true;
			expectTypeOf(booksExpect).toMatchTypeOf<boolean>();
		});

		test("inferInsert column types", () => {
			const columns = {
				pk: integer(),
				id: serial(),
				name: varchar().notNull(),
				subscribed: boolean(),
				email: text().notNull(),
				subscribers: int4(),
			};
			const tbl = pgTable("users", {
				columns: columns,
			});
			type ExpectedType = {
				pk?: number | string | null;
				id?: number | string;
				name: string;
				email: string;
				subscribed?: boolean | null;
				subscribers?: number | string | null;
			};
			type InferredInsertType = typeof tbl.inferInsert;
			const expect: Expect<Equal<InferredInsertType, ExpectedType>> = true;
			expectTypeOf(expect).toMatchTypeOf<boolean>();
		});
	});

	test("inferUpdate column types", () => {
		const columns = {
			pk: integer(),
			id: serial(),
			name: varchar().notNull(),
			subscribed: boolean(),
			email: text().notNull(),
			subscribers: int4(),
		};
		const tbl = pgTable("users", {
			columns: columns,
		});
		type ExpectedType = {
			pk?: number | string | null;
			id?: string | number;
			name?: string;
			email?: string;
			subscribed?: boolean | null;
			subscribers?: number | string | null;
		};
		type InferredUpdateType = typeof tbl.inferUpdate;
		const expect: Expect<Equal<InferredUpdateType, ExpectedType>> = true;
		expectTypeOf(expect).toMatchTypeOf<boolean>();
	});

	test("indexes are empty by default", () => {
		const columns = {
			name: varchar(),
			subscribed: boolean(),
		};
		const tbl = pgTable("users", {
			columns: columns,
		});
		expect(tbl.indexes).toStrictEqual([]);
	});

	test("indexes can be added", () => {
		const columns = {
			name: varchar(),
			subscribed: boolean(),
		};
		const tbl = pgTable("users", {
			columns: columns,
			indexes: [
				index("name", (idx) => idx.unique().using("btree")),
				index("subscribed", (idx) => idx.unique().using("btree")),
			],
		});
		expect(tbl.indexes?.length).toBe(2);
		for (const idx of tbl.indexes || []) {
			expect(idx).toBeInstanceOf(PgIndex);
		}
	});

	describe("constraints", () => {
		test("constraints are empty by default", () => {
			const columns = {
				name: varchar(),
				subscribed: boolean(),
			};
			const tbl = pgTable("users", {
				columns: columns,
			});
			expect(tbl.constraints).toStrictEqual([]);
		});

		test("foreign key constraints can be added", () => {
			const books = pgTable("books", {
				columns: {
					id: serial(),
					name: varchar(),
					location: varchar(),
				},
				constraints: [unique(["name", "location"])],
			});

			const users = pgTable("users", {
				columns: {
					id: serial(),
					name: varchar(),
					subscribed: boolean(),
					book_id: integer(),
				},
				constraints: [foreignKey(["book_id"], books, ["id"])],
			});
			expect(users.constraints?.length).toBe(1);
			for (const constraint of users.constraints || []) {
				expect(constraint).toBeInstanceOf(PgForeignKey);
			}
		});

		test("unique constraints can be added", () => {
			const columns = {
				id: serial(),
				name: varchar(),
				subscribed: boolean(),
			};

			const tbl = pgTable("users", {
				columns: columns,
				constraints: [unique(["name"]), unique(["subscribed"])],
			});
			expect(tbl.constraints?.length).toBe(2);
			for (const constraint of tbl.constraints || []) {
				expect(constraint).toBeInstanceOf(PgUnique);
			}
		});

		test("primary key constraints can be added the table level", () => {
			const columns = {
				id: integer(),
				name: varchar(),
			};
			const tbl = pgTable("users", {
				columns: columns,
				constraints: [primaryKey(["id", "name"])],
			});
			expect(tbl.constraints?.length).toBe(1);
			for (const constraint of tbl.constraints || []) {
				expect(constraint).toBeInstanceOf(PgPrimaryKey);
			}
		});
	});
});
