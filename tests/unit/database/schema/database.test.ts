import { Equal, Expect } from "type-testing";
import { describe, expect, expectTypeOf, test } from "vitest";
import { pgDatabase } from "~/database/schema/database.js";
import { pgVarChar } from "~/database/schema/pg_column.js";
import { pgTable } from "~/database/schema/table.js";

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
