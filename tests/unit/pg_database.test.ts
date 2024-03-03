import { Equal, Expect } from "type-testing";
import { describe, expect, expectTypeOf, test } from "vitest";
import {
	pgBoolean,
	pgSerial,
	pgText,
	pgVarchar,
} from "~/database/schema/pg_column.js";
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
		const users = pgTable({
			columns: {
				name: pgVarchar(),
			},
		});
		const teams = pgTable({
			columns: {
				name: pgVarchar(),
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
	const users = pgTable({
		columns: {
			id: pgSerial(),
			name: pgVarchar().notNull(),
			email: pgText().notNull(),
			address: pgText(),
		},
	});
	const books = pgTable({
		columns: {
			id: pgSerial(),
			title: pgVarchar().notNull(),
			borrowed: pgBoolean().notNull(),
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
