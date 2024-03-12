/* eslint-disable max-lines */
import { Equal, Expect } from "type-testing";
import { describe, expect, expectTypeOf, test } from "vitest";
import { boolean, serial, text, varchar } from "~/schema/pg_column.js";
import { PgDatabase, pgDatabase } from "~/schema/pg_database.js";
import { table } from "~/schema/pg_table.js";

describe("pgDatabase definition", () => {
	test("without tables", () => {
		const database = pgDatabase({ tables: {} });
		// eslint-disable-next-line @typescript-eslint/ban-types
		const expect: Expect<Equal<typeof database, PgDatabase<{}>>> = true;
		expectTypeOf(expect).toMatchTypeOf<boolean>();
	});

	test("with tables", () => {
		const users = table({
			columns: {
				name: varchar(),
			},
		});
		const teams = table({
			columns: {
				name: varchar(),
			},
		});
		const database = pgDatabase({
			tables: { users, teams },
		});
		const tables = PgDatabase.info(database).tables;
		expect(tables.users).toBe(users);
		expect(tables.teams).toBe(teams);

		const expectation: Expect<
			Equal<
				typeof database,
				PgDatabase<{ users: typeof users; teams: typeof teams }>
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

	expect(PgDatabase.info(database).extensions).toStrictEqual([
		"pgcrypto",
		"btree_gist",
	]);
});

test("types for Kysely", () => {
	const users = table({
		columns: {
			id: serial(),
			name: varchar().notNull(),
			email: text().notNull(),
			address: text(),
		},
	});
	const books = table({
		columns: {
			id: serial(),
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

	type InferredDBTypes = typeof database.infer;
	const dbExpect: Expect<Equal<InferredDBTypes, ExpectedType>> = true;
	expectTypeOf(dbExpect).toMatchTypeOf<boolean>();
});
