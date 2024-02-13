import { Equal, Expect } from "type-testing";
import { describe, expect, expectTypeOf, test } from "vitest";
import { boolean, serial, text, varchar } from "~/database/schema/pg_column.js";
import { pgDatabase } from "~/database/schema/pg_database.js";
import { pgTable } from "~/database/schema/pg_table.js";

describe("pgDatabase definition", () => {
	test("without tables", () => {
		const database = pgDatabase({ tables: {} });
		// biome-ignore lint/complexity/noBannedTypes: <explanation>
		const expect: Expect<Equal<typeof database, pgDatabase<{}>>> = true;
		expectTypeOf(expect).toMatchTypeOf<boolean>();
	});

	test("with tables", () => {
		const users = pgTable("users", {
			columns: {
				name: varchar(),
			},
		});
		const teams = pgTable("teams", {
			columns: {
				name: varchar(),
			},
		});
		const database = pgDatabase({
			tables: { users, teams },
		});
		expect(database.tables?.users).toBe(users);
		expect(database.tables?.teams).toBe(teams);

		const expectation: Expect<
			Equal<
				typeof database,
				pgDatabase<{ users: typeof users; teams: typeof teams }>
			>
		> = true;
		expectTypeOf(expectation).toMatchTypeOf<boolean>();
	});
});

test("with extensions", () => {
	const database = pgDatabase({
		extensions: ["pgcrypto", "btree_gist"],
		tables: {},
	});

	expect(database.extensions).toStrictEqual(["pgcrypto", "btree_gist"]);
});

test("types for Kysely", () => {
	const users = pgTable("users", {
		columns: {
			id: serial().primaryKey(),
			name: varchar().notNull(),
			email: text().notNull(),
			address: text(),
		},
	});
	const books = pgTable("books", {
		columns: {
			id: serial().primaryKey(),
			title: varchar().notNull(),
			borrowed: boolean().notNull(),
		},
	});
	const database = pgDatabase({
		tables: {
			users,
			books,
		},
	});

	type ExpectedType = {
		users: typeof users.infer;
		books: typeof books.infer;
	};

	type InferredDBTypes = typeof database.kyselyDatabase;
	const dbExpect: Expect<Equal<InferredDBTypes, ExpectedType>> = true;
	expectTypeOf(dbExpect).toMatchTypeOf<boolean>();
});
