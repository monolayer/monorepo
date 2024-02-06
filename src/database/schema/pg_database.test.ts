import { Equal, Expect } from "type-testing";
import { describe, expect, expectTypeOf, test } from "vitest";
import {
	pgBoolean,
	pgSerial,
	pgText,
	pgVarChar,
} from "~/database/schema/pg_column.js";
import { pgDatabase } from "~/database/schema/pg_database.js";
import { pgTable } from "~/database/schema/pg_table.js";

describe("pgDatabase definition", () => {
	test("without tables", () => {
		const database = pgDatabase({});
		// biome-ignore lint/complexity/noBannedTypes: <explanation>
		const expect: Expect<Equal<typeof database, pgDatabase<{}>>> = true;
		expectTypeOf(expect).toMatchTypeOf<boolean>();
	});

	test("with tables", () => {
		const users = pgTable("users", {
			columns: {
				name: pgVarChar(),
			},
		});
		const teams = pgTable("teams", {
			columns: {
				name: pgVarChar(),
			},
		});
		const database = pgDatabase({
			users,
			teams,
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

test("types for Kysely", () => {
	const users = pgTable("users", {
		columns: {
			id: pgSerial().primaryKey(),
			name: pgVarChar().notNull(),
			email: pgText().notNull(),
			address: pgText(),
		},
	});
	const books = pgTable("books", {
		columns: {
			id: pgSerial().primaryKey(),
			title: pgVarChar().notNull(),
			borrowed: pgBoolean().notNull(),
		},
	});
	const database = pgDatabase({
		users,
		books,
	});

	type ExpectedType = {
		users: typeof users.infer;
		books: typeof books.infer;
	};

	type InferredDBTypes = typeof database.kyselyDatabase;
	const dbExpect: Expect<Equal<InferredDBTypes, ExpectedType>> = true;
	expectTypeOf(dbExpect).toMatchTypeOf<boolean>();
});
